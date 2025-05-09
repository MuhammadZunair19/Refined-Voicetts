const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function processVoice(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/process-voice`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to process voice")
    }

    return await response.json()
  } catch (error) {
    console.error("Error processing voice:", error)
    throw error
  }
}

export async function synthesizeSpeech(text, requestId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/synthesize-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, requestId }),
    })

    if (!response.ok) {
      throw new Error("Failed to synthesize speech")
    }

    return await response.json()
  } catch (error) {
    console.error("Error synthesizing speech:", error)
    throw error
  }
}

export async function getHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/history`)

    if (!response.ok) {
      throw new Error("Failed to fetch history")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching history:", error)
    throw error
  }
}

