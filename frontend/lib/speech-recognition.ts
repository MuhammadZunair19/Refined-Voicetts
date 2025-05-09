// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
    interpretation: any
  }
  
  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult
    length: number
  }
  
  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative
    length: number
    isFinal: boolean
  }
  
  interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
  }
  
  // Define the SpeechRecognition type
  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    maxAlternatives: number
    start: () => void
    stop: () => void
    abort: () => void
    onresult: (event: SpeechRecognitionEvent) => void
    onerror: (event: Event) => void
    onend: () => void
    onstart: () => void
    onspeechend: () => void
    onsoundstart: () => void
    onsoundend: () => void
    onaudiostart: () => void
    onaudioend: () => void
    onnomatch: () => void
  }
  
  // Define the SpeechRecognition constructor
  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition
  }
  
  // Add declarations to the global Window interface
  declare global {
    interface Window {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
  }
  
  // Get the correct implementation of SpeechRecognition
  export const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
    if (typeof window === "undefined") return null
  
    return window.SpeechRecognition || window.webkitSpeechRecognition || null
  }
  
  // Create a speech recognition instance
  export const createSpeechRecognition = (): SpeechRecognition | null => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) return null
  
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognition.maxAlternatives = 1
  
    return recognition
  }
  
  // Check if speech recognition is supported
  export const isSpeechRecognitionSupported = (): boolean => {
    return getSpeechRecognition() !== null
  }
  
  