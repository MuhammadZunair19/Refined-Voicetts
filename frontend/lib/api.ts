// This file contains the API functions for the voice call component

// Message type for conversation history
export type Message = {
  role: "user" | "assistant"
  content: string
}

// WebSocket connection
let socket: WebSocket | null = null
let isConnected = false
const messageQueue: Array<{ type: string; data: any }> = []
let onMessageCallbacks: Array<(data: any) => void> = []

// Initialize WebSocket connection
export function initializeWebSocket(callbacks?: {
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
}) {
  // Close existing connection if any
  if (socket) {
    socket.close()
  }

  // Create new WebSocket connection
  socket = new WebSocket("wss://early-guiding-feline.ngrok-free.app")

  // Store the socket in window for access from other functions
  if (typeof window !== "undefined") {
    ;(window as any).__voiceCallWebSocket = socket
  }

  socket.onopen = () => {
    console.log("WebSocket connection established")
    isConnected = true

    // Process any queued messages
    while (messageQueue.length > 0) {
      const message = messageQueue.shift()
      if (message && socket) {
        socket.send(JSON.stringify(message))
      }
    }

    if (callbacks?.onOpen) callbacks.onOpen()
  }

  socket.onclose = (event) => {
    console.log("WebSocket connection closed:", event)
    isConnected = false
    if (callbacks?.onClose) callbacks.onClose()
  }

  socket.onerror = (error) => {
    console.error("WebSocket error:", error)
    if (callbacks?.onError) callbacks.onError(error)
  }

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      console.log("Received WebSocket message:", data)

      // Notify all registered callbacks
      onMessageCallbacks.forEach((callback) => callback(data))
    } catch (error) {
      console.error("Error parsing WebSocket message:", error)
    }
  }

  return socket
}

// Register a callback for WebSocket messages
export function onWebSocketMessage(callback: (data: any) => void) {
  onMessageCallbacks.push(callback)
  return () => {
    onMessageCallbacks = onMessageCallbacks.filter((cb) => cb !== callback)
  }
}

// Send a message through WebSocket
export function sendWebSocketMessage(type: string, data: any) {
  const message = { type, data }

  if (isConnected && socket) {
    socket.send(JSON.stringify(message))
  } else {
    // Queue message if not connected
    messageQueue.push(message)

    // Try to initialize WebSocket if not already done
    if (!socket) {
      initializeWebSocket()
    }
  }
}

// Send audio data to the server
export function sendAudioData(audioData: string) {
  sendWebSocketMessage("audio", audioData)
}

// Notify server that audio playback has finished
export function notifyPlaybackFinished() {
  sendWebSocketMessage("playback_finished", {})
}

// Set script type
export function setScriptType(scriptType: string) {
  console.log(`Setting script type to: ${scriptType}`)
  sendWebSocketMessage("script_type", scriptType)
  return isConnected // Return connection status to indicate if message was sent immediately
}

// Set context
export function setContext(context: string) {
  sendWebSocketMessage("context", context)
}

// Get the current WebSocket instance
export function getWebSocket(): WebSocket | null {
  if (typeof window !== "undefined") {
    return (window as any).__voiceCallWebSocket || socket
  }
  return socket
}

// Send conversation message (compatibility function for the existing component)
export async function sendConversationMessage(
  message: string,
  conversationId?: string | null,
): Promise<{ text: string; conversationId: string }> {
  return new Promise((resolve, reject) => {
    // Create a one-time message handler
    const messageHandler = (data: any) => {
      if (data.type === "response") {
        // Remove this one-time handler
        onMessageCallbacks = onMessageCallbacks.filter((cb) => cb !== messageHandler)

        // Resolve with the response
        resolve({
          text: data.text,
          conversationId: conversationId || "websocket-conversation",
        })
      } else if (data.type === "error") {
        // Remove this one-time handler
        onMessageCallbacks = onMessageCallbacks.filter((cb) => cb !== messageHandler)

        // Reject with the error
        reject(new Error(data.message))
      }
    }

    // Register the message handler
    onMessageCallbacks.push(messageHandler)

    // Send the message as context (since we're not actually sending audio here)
    setContext(message)

    // Simulate an empty audio message to trigger processing
    // This is a workaround since the Python backend expects audio data
    const emptyAudioData = "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" // Empty WAV file in base64
    sendAudioData(emptyAudioData)
  })
}

// Synthesize speech (compatibility function for the existing component)
export async function synthesizeSpeech(text: string, voice: string): Promise<{ audioUrl: string }> {
  return new Promise((resolve, reject) => {
    // Create a one-time message handler
    const messageHandler = (data: any) => {
      if (data.type === "audio") {
        // Remove this one-time handler
        onMessageCallbacks = onMessageCallbacks.filter((cb) => cb !== messageHandler)

        // Convert base64 audio to blob URL
        const audioBlob = base64ToBlob(data.audio, "audio/wav")
        const audioUrl = URL.createObjectURL(audioBlob)

        // Resolve with the audio URL
        resolve({ audioUrl })
      } else if (data.type === "error") {
        // Remove this one-time handler
        onMessageCallbacks = onMessageCallbacks.filter((cb) => cb !== messageHandler)

        // Reject with the error
        reject(new Error(data.message))
      }
    }

    // Register the message handler
    onMessageCallbacks.push(messageHandler)
  })
}

// Helper function to convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string) {
  const byteCharacters = atob(base64)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)

    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }

  return new Blob(byteArrays, { type: mimeType })
}

