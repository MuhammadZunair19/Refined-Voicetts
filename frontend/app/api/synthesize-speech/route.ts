import type { NextRequest } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    console.log("Starting synthesize-speech streaming endpoint...")

    const { text } = await request.json()

    if (!text) {
      console.log("No text provided")
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Validate ELEVENLABS_API_KEY
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
    if (!elevenLabsApiKey) {
      console.error("ELEVENLABS_API_KEY not found in environment variables")
      return new Response(
        JSON.stringify({
          error: "Server configuration error: Missing API key",
          useClientSynthesis: true,
          text: text,
        }),
        {
          status: 200, // Return 200 instead of 500 to allow client fallback
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Default voice ID for ElevenLabs
    const voiceId = "EXAVITQu4vr4xnSDxMaL"

    console.log("Making request to ElevenLabs API for streaming...")

    // Make the request to ElevenLabs API
    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsApiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    })

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text()
      console.error("ElevenLabs API error:", errorText)
      return new Response(
        JSON.stringify({
          error: "Failed to synthesize speech with ElevenLabs API",
          useClientSynthesis: true,
          text: text,
        }),
        {
          status: 200, // Return 200 instead of 500 to allow client fallback
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Get the audio data as a blob
    const audioBlob = await elevenLabsResponse.blob()

    // Stream the audio directly to the client
    console.log("Successfully connected to ElevenLabs, returning audio...")
    return new Response(audioBlob, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    })
  } catch (error) {
    console.error("Error in synthesize-speech endpoint:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to synthesize speech",
        details: error instanceof Error ? error.message : "Unknown error",
        useClientSynthesis: true,
        text: "I'm sorry, there was an error generating the audio. Please try again.",
      }),
      {
        status: 200, // Return 200 instead of 500 to allow client fallback
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

