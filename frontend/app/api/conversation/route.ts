import { type NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { text, conversationId, conversationHistory = [] } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Get Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error("Gemini API key not configured");
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    console.log("Processing message:", text.substring(0, 50) + (text.length > 50 ? "..." : ""));

    // Format conversation history
    const formattedHistory = conversationHistory.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // System prompt for short, clear responses
    const systemPrompt = {
      role: "model",
      parts: [
        {
          text: "Respond in a maximum of 2 sentences. Keep it natural, avoid long explanations, lists, markdown, or excessive details. Be concise and clear.",
        },
      ],
    };
    
    // Prepare request body for Gemini API
    const requestBody = {
      contents: [systemPrompt, ...formattedHistory, { role: "user", parts: [{ text }] }],
      generation_config: {
        temperature: 0.4,  // Reduce randomness for focused responses
        top_p: 0.6,  // Prioritize high-probability responses
        top_k: 15,  // Reduce output diversity for clarity
        max_output_tokens: 100,  // Shorter responses (enforces brevity)
        stop_sequences: ["\n"],  // Stop after the first newline (prevents long outputs)
      },
    };
    

    // Make request to Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error("Gemini API error:", errorData);
      return NextResponse.json({ error: "Failed to process with Gemini API" }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();

    // Extract and clean response text
    let responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";

    // Remove Markdown formatting like **bold**, *italics*, and extra spaces
    responseText = responseText
      .replace(/\*\*/g, "")  // Remove double asterisks (**bold**)
      .replace(/\*/g, "")  // Remove single asterisks (*italics*)
      .replace(/(\r\n|\r|\n){2,}/g, "\n")  // Convert multiple newlines to a single newline
      .replace(/\s{2,}/g, " ")  // Replace multiple spaces with a single space
      .trim();
    
    // Limit response length to 250 characters (adjustable)
    if (responseText.length > 250) {
      responseText = responseText.substring(0, 250) + "..."; // Truncate and add ellipsis
    }
    
    
    console.log("Generated response:", responseText.substring(0, 50) + (responseText.length > 50 ? "..." : ""));

    return NextResponse.json({
      text: responseText,
      conversationId: conversationId || Date.now().toString(),
    });

  } catch (error) {
    console.error("Error in conversation endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to process conversation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
