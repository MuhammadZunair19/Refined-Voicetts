import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { existsSync } from 'fs'

export const runtime = 'nodejs'; // Ensures this runs on Node.js runtime

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const prompt = formData.get('prompt') as string || 'Please transcribe this audio and respond appropriately.'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Create tmp directory if it doesn't exist
    const tmpDir = path.join(process.cwd(), 'tmp')
    if (!existsSync(tmpDir)) {
      await mkdir(tmpDir, { recursive: true })
    }
    
    // Create a unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Sanitize filename to remove special characters
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${uuidv4()}-${sanitizedOriginalName}`
    const filePath = path.join(tmpDir, fileName)
    
    // Write the file with error handling
    try {
      await writeFile(filePath, buffer)
      console.log('File written successfully:', filePath)
    } catch (writeError) {
      console.error('Error writing file:', writeError)
      return NextResponse.json(
        { error: 'Failed to write file' },
        { status: 500 }
      )
    }
    
    console.log('Temporary directory path:', tmpDir);
    console.log('File path:', filePath);
    
    // Prepare the request to Gemini API
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      console.error('Gemini API key not configured')
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }
    
    // Convert audio file to base64
    const base64Audio = buffer.toString('base64')
    
    // Prepare the request body for Gemini API
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: file.type, data: base64Audio } }
          ]
        }
      ],
      generation_config: {
        temperature: 0.4,
        top_p: 0.95,
        top_k: 40,
        max_output_tokens: 300 // Limit response length
      }
    }
    
    // Make request to Gemini API with error handling
    let geminiResponse;
    try {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      )
    } catch (fetchError) {
      console.error('Error making request to Gemini API:', fetchError)
      return NextResponse.json(
        { error: 'Failed to connect to Gemini API' },
        { status: 500 }
      )
    }
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error('Gemini API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to process with Gemini API' },
        { status: 500 }
      )
    }
    
    const geminiData = await geminiResponse.json()
    
    // Extract text from Gemini response, clean up asterisks and excessive whitespace
    let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated'

    // Remove markdown-style asterisks and trim spaces
    text = text.replace(/\*\*/g, '').replace(/\*/g, '').trim();

    // Clean up: Delete the temporary file
    try {
      await unlink(filePath)
    } catch (error) {
      console.error('Error deleting temporary file:', error)
      // Continue execution even if file deletion fails
    }
    
    return NextResponse.json({ text })
  } catch (error) {
    console.error('Error processing voice:', error)
    return NextResponse.json(
      { error: 'Failed to process voice' },
      { status: 500 }
    )
  }
}