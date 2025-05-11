"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Volume2, Loader2, VolumeX, Sparkles, ChevronDown, Phone } from 'lucide-react'
import { createSpeechRecognition } from "@/lib/speech-recognition"
import {
  sendConversationMessage,
  type Message,
  initializeWebSocket,
  onWebSocketMessage,
  notifyPlaybackFinished,
  setScriptType,
  base64ToArrayBuffer,
} from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { cn, formatTime } from "@/lib/utils"

// Define script types and their descriptions
const SCRIPT_TYPES = [
  {
    id: "reliant_bpo",
    name: "Reliant BPO",
    description: "Fronting Only - Qualify leads and transfer to closers",
  },
  {
    id: "21st_bpo",
    name: "21st BPO",
    description: "Fronting, Verification, and Closing - Qualify and close deals",
  },
  {
    id: "sirus_solutions",
    name: "Sirus Solutions",
    description: "Fronting Demo Calls - Pitch to doctors and book appointments",
  },
]

// WAV header constants
const RIFF_HEADER_SIZE = 44;
const SAMPLE_RATE = 24000; // Adjust based on your audio format
const NUM_CHANNELS = 1; // Mono
const BITS_PER_SAMPLE = 16; // 16-bit audio

export const VoiceCall = ({ onEndCall }: { onEndCall?: () => void }) => {
  const [transcription, setTranscription] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [audioVisualization, setAudioVisualization] = useState<number[]>([])
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null)
  const [listeningDuration, setListeningDuration] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [serverState, setServerState] = useState<string>("Idle")
  const [selectedScriptType, setSelectedScriptType] = useState<string>("reliant_bpo")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const callDurationTimerRef = useRef<NodeJS.Timeout | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const audioQueueRef = useRef<Uint8Array[]>([])
  const isPlayingRef = useRef<boolean>(false)
  const recognitionRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const listeningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSpeechRef = useRef<number>(Date.now())
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isAudioProcessingRef = useRef<boolean>(false)
  const recognitionStartTimeRef = useRef<number>(0)
  const responseCountRef = useRef<number>(0)
  const gainNodeRef = useRef<GainNode | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversationHistory])

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Create a gain node for volume control
        gainNodeRef.current = audioContextRef.current.createGain()
        gainNodeRef.current.gain.value = 1.0
        gainNodeRef.current.connect(audioContextRef.current.destination)
        
        console.log("Audio context initialized")
      } catch (e) {
        console.error("Failed to initialize audio context:", e)
      }
    }
    
    return () => {
      // Clean up audio context when component unmounts
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
        audioContextRef.current = null
      }
    }
  }, [])

  // Initialize WebSocket connection
  useEffect(() => {
    initializeWebSocket({
      onOpen: () => {
        console.log("WebSocket connected")
        toast({
          title: "Connected to server",
          description: "Voice call system is ready to use.",
        })

        // Send the initial script type when connection is established
        if (selectedScriptType) {
          setScriptType(selectedScriptType)
        }
      },
      onClose: () => {
        console.log("WebSocket disconnected")
        toast({
          title: "Disconnected from server",
          description: "Connection to voice call server lost.",
          variant: "destructive",
        })
      },
      onError: (error) => {
        console.error("WebSocket error:", error)
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice call server.",
          variant: "destructive",
        })
      },
    })

    // Set up WebSocket message handler
    const unsubscribe = onWebSocketMessage((data) => {
      try {
        if (data.type === "state") {
          const prevState = serverState
          setServerState(data.state)
          console.log(`Server state changed: ${prevState} -> ${data.state}`)

          // Update our UI state based on server state
          if (data.state === "Processing") {
            setIsProcessing(true)
            setIsListening(false)
            
            // Make sure we're not in a speaking state
            if (isSpeaking) {
              setIsSpeaking(false)
            }
          } else if (data.state === "Speaking") {
            setIsProcessing(false)
            // Don't set isSpeaking here - we'll set it when we actually play the audio
          } else if (data.state === "Idle") {
            setIsProcessing(false)
            // Don't reset isSpeaking here - we'll handle that when audio playback ends

            // Restart listening if we're active, not muted, not speaking, and not processing audio
            if (isActive && !isMuted && !isSpeaking && !isAudioProcessingRef.current) {
              console.log("Server is idle, restarting recognition")
              setTimeout(() => {
                setupAndStartRecognition()
              }, 1000)
            }
          }
        } else if (data.type === "transcription") {
          setTranscription(data.text)
        } else if (data.type === "response") {
          // Add assistant response to conversation
          setConversationHistory((prev) => [...prev, { role: "assistant", content: data.text }])
          if (data.conversationId) {
            setConversationId(data.conversationId)
          }
          
          // Mark that we're processing audio
          isAudioProcessingRef.current = true
          
          // Increment response counter
          responseCountRef.current += 1
          console.log(`Received response #${responseCountRef.current}, waiting for audio chunks...`)
          
          // Reset audio chunks array
          audioChunksRef.current = []
          
          // Stop recognition while we're processing the response
          stopRecognition()
        } else if (data.type === "audio_chunk") {
          // Process the audio chunk
          try {
            const audioData = base64ToArrayBuffer(data.audio)
            if (audioData.byteLength === 0) {
              console.warn("Received empty audio chunk, skipping")
              return
            }
            
            console.log(`Received audio chunk for response #${responseCountRef.current}`)
            
            // Set speaking state if this is the first chunk
            if (!isSpeaking) {
              setIsSpeaking(true)
            }
            
            // Create a blob from the audio data
            const audioBlob = new Blob([audioData], { type: 'audio/wav' })
            
            // Add to our chunks array
            audioChunksRef.current.push(audioBlob)
            
            // Play the audio chunk
            playAudioChunk(audioBlob)
          } catch (e) {
            console.error("Error processing audio chunk:", e)
          }
        } else if (data.type === "audio_end") {
          console.log(`Audio streaming complete for response #${responseCountRef.current}`)
          
          // Wait a bit to ensure all audio has been played
          setTimeout(() => {
            handleAudioFinished()
          }, 500)
        } else if (data.type === "info") {
          toast({
            title: "Info",
            description: data.message,
          })
        } else if (data.type === "error") {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          })
          
          // Reset audio processing state on error
          isAudioProcessingRef.current = false
          
          // Try to restart listening if we're not already
          if (isActive && !isMuted && !isListening && !isSpeaking) {
            setTimeout(() => {
              setupAndStartRecognition()
            }, 2000)
          }
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error)
        isAudioProcessingRef.current = false
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Function to create a WAV header
  const createWavHeader = (dataLength: number) => {
    const header = new ArrayBuffer(RIFF_HEADER_SIZE);
    const view = new DataView(header);
    
    // RIFF identifier
    view.setUint8(0, 'R'.charCodeAt(0));
    view.setUint8(1, 'I'.charCodeAt(0));
    view.setUint8(2, 'F'.charCodeAt(0));
    view.setUint8(3, 'F'.charCodeAt(0));
    
    // File length
    view.setUint32(4, 36 + dataLength, true);
    
    // WAVE identifier
    view.setUint8(8, 'W'.charCodeAt(0));
    view.setUint8(9, 'A'.charCodeAt(0));
    view.setUint8(10, 'V'.charCodeAt(0));
    view.setUint8(11, 'E'.charCodeAt(0));
    
    // FMT header
    view.setUint8(12, 'f'.charCodeAt(0));
    view.setUint8(13, 'm'.charCodeAt(0));
    view.setUint8(14, 't'.charCodeAt(0));
    view.setUint8(15, ' '.charCodeAt(0));
    
    // Format chunk length
    view.setUint32(16, 16, true);
    
    // Sample format (raw)
    view.setUint16(20, 1, true);
    
    // Channel count
    view.setUint16(22, NUM_CHANNELS, true);
    
    // Sample rate
    view.setUint32(24, SAMPLE_RATE, true);
    
    // Byte rate (sample rate * block align)
    view.setUint32(28, SAMPLE_RATE * NUM_CHANNELS * BITS_PER_SAMPLE / 8, true);
    
    // Block align (channel count * bytes per sample)
    view.setUint16(32, NUM_CHANNELS * BITS_PER_SAMPLE / 8, true);
    
    // Bits per sample
    view.setUint16(34, BITS_PER_SAMPLE, true);
    
    // DATA header
    view.setUint8(36, 'd'.charCodeAt(0));
    view.setUint8(37, 'a'.charCodeAt(0));
    view.setUint8(38, 't'.charCodeAt(0));
    view.setUint8(39, 'a'.charCodeAt(0));
    
    // Data chunk length
    view.setUint32(40, dataLength, true);
    
    return new Uint8Array(header);
  }

  // Function to play an audio chunk
  const playAudioChunk = (audioBlob: Blob) => {
    if (!audioRef.current) return
    
    // Create a URL for the audio blob
    const audioUrl = URL.createObjectURL(audioBlob)
    
    // If this is the first chunk, set up the audio element
    if (!isPlayingRef.current) {
      // Set up the audio element
      audioRef.current.onplay = () => {
        isPlayingRef.current = true
      }
      
      audioRef.current.onended = () => {
        // Clean up the current audio URL
        if (audioRef.current && audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src)
          audioRef.current.src = ""
        }
        
        // Check if there are more chunks in the queue
        if (audioChunksRef.current.length > 0) {
          const nextChunk = audioChunksRef.current.shift()
          if (nextChunk) {
            const nextUrl = URL.createObjectURL(nextChunk)
            audioRef.current.src = nextUrl
            audioRef.current.play().catch(err => {
              console.error("Error playing next audio chunk:", err)
              isPlayingRef.current = false
            })
          }
        } else {
          // No more chunks, we're done playing
          isPlayingRef.current = false
        }
      }
      
      // Set the source and play
      audioRef.current.src = audioUrl
      audioRef.current.play().catch(err => {
        console.error("Error playing audio chunk:", err)
        isPlayingRef.current = false
      })
    } else {
      // We're already playing audio, add this chunk to the queue
      audioChunksRef.current.push(audioBlob)
    }
  }

  // Function to handle when all audio has finished playing
  const handleAudioFinished = () => {
    console.log(`All audio finished for response #${responseCountRef.current}`)
    
    // Update state
    setIsSpeaking(false)
    
    // Clear audio resources
    if (audioRef.current) {
      const oldSrc = audioRef.current.src
      audioRef.current.src = ""
      
      // Remove event handlers
      audioRef.current.onplay = null
      audioRef.current.onended = null
      
      // Revoke object URL
      if (oldSrc) {
        URL.revokeObjectURL(oldSrc)
      }
    }

    // Clear audio queue
    audioChunksRef.current = []
    isAudioProcessingRef.current = false
    isPlayingRef.current = false

    // Notify the server that audio playback has finished
    notifyPlaybackFinished()

    // Auto-start listening again after AI finishes speaking if we're still active
    if (isActive && !isMuted) {
      console.log("Restarting recognition after audio ended")
      
      // Add a delay before restarting recognition to prevent feedback
      setTimeout(() => {
        if (!isListening && !isSpeaking && !isProcessing && !isAudioProcessingRef.current) {
          console.log("Delayed restart of recognition after audio ended")
          setupAndStartRecognition()
        } else {
          console.log("Skipping delayed restart because state changed:", {
            isListening,
            isSpeaking,
            isProcessing,
            isAudioProcessing: isAudioProcessingRef.current
          })
        }
      }, 1000)
    }
  }

  // Initialize speech recognition and set up keep-alive
  useEffect(() => {
    if (typeof window !== "undefined" && isActive && !isMuted && !isSpeaking && !isAudioProcessingRef.current) {
      console.log("Setting up initial speech recognition")
      setupAndStartRecognition()

      // Set up a keep-alive interval
      keepAliveIntervalRef.current = setInterval(() => {
        if (!isListening && !isProcessing && !isSpeaking && isActive && !isMuted && !isAudioProcessingRef.current) {
          console.log("Keep-alive: restarting speech recognition")
          setupAndStartRecognition()
        }
      }, 10000) // Check every 10 seconds
    }

    return () => {
      cleanupSpeechRecognition()
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current)
        keepAliveIntervalRef.current = null
      }
    }
  }, [isActive, isSpeaking])

  // Handle mute state changes
  useEffect(() => {
    if (isMuted) {
      // When muted, stop recognition
      stopRecognition()

      // Also stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        setIsSpeaking(false)
        isPlayingRef.current = false
      }
    } else if (isActive && !isProcessing && !isSpeaking && !isAudioProcessingRef.current) {
      // When unmuted, start recognition only if not speaking
      console.log("Unmuted, starting recognition")
      setupAndStartRecognition()
    }
  }, [isMuted, isSpeaking])

  // Add effect to stop recognition when speaking starts
  useEffect(() => {
    if (isSpeaking) {
      console.log("AI is speaking - stopping microphone")
      stopRecognition()
    } else if (isActive && !isMuted && !isProcessing && !isSpeaking && !isAudioProcessingRef.current) {
      console.log("AI finished speaking - restarting microphone")
      // Small delay to ensure audio playback is fully complete
      setTimeout(() => {
        setupAndStartRecognition()
      }, 1000)
    }
  }, [isSpeaking])

  // Add recovery mechanism to ensure we're always listening when we should be
  useEffect(() => {
    // If we're active but not listening, speaking, or processing, restart listening
    if (isActive && !isListening && !isSpeaking && !isProcessing && !isAudioProcessingRef.current && !isMuted) {
      console.log("Recovery: We should be listening but we're not. Restarting recognition...")
      
      // Add a small delay to avoid rapid restarts
      const recoveryTimeout = setTimeout(() => {
        setupAndStartRecognition()
      }, 2000)
      
      return () => clearTimeout(recoveryTimeout)
    }
  }, [isActive, isListening, isSpeaking, isProcessing, isMuted])

  // Track call duration
  useEffect(() => {
    if (isActive) {
      // Start call duration timer
      setCallDuration(0)
      callDurationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      // Clear call duration timer
      if (callDurationTimerRef.current) {
        clearInterval(callDurationTimerRef.current)
        callDurationTimerRef.current = null
      }
    }

    return () => {
      if (callDurationTimerRef.current) {
        clearInterval(callDurationTimerRef.current)
        callDurationTimerRef.current = null
      }
    }
  }, [isActive])

  const setupAndStartRecognition = () => {
    // Check if we're already listening
    if (isListening && recognitionRef.current) {
      console.log("Recognition is already active, not starting again")
      return
    }
    
    // Check if we should be listening at all
    if (!isActive || isMuted || isSpeaking || isProcessing || isAudioProcessingRef.current) {
      console.log("Not starting recognition because:", {
        isActive,
        isMuted,
        isSpeaking,
        isProcessing,
        isAudioProcessing: isAudioProcessingRef.current
      })
      return
    }

    // Check if we've tried to start recognition too recently (prevent rapid restarts)
    const now = Date.now()
    if (now - recognitionStartTimeRef.current < 1000) {
      console.log("Tried to start recognition too soon after previous attempt, delaying")
      setTimeout(() => {
        setupAndStartRecognition()
      }, 1000)
      return
    }
    
    recognitionStartTimeRef.current = now
    console.log("Setting up speech recognition")

    // Clean up any existing recognition
    stopRecognition()

    // Create a new recognition instance
    recognitionRef.current = createSpeechRecognition()

    if (!recognitionRef.current) {
      console.error("Failed to create speech recognition")
      return
    }

    // Configure recognition
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true

    // Set up event handlers
    recognitionRef.current.onstart = () => {
      console.log("Speech recognition started")
      setIsListening(true)
      setListeningDuration(0)

      // Start timer for listening duration
      if (listeningTimerRef.current) {
        clearInterval(listeningTimerRef.current)
      }

      listeningTimerRef.current = setInterval(() => {
        setListeningDuration((prev) => prev + 1)
      }, 1000)
    }

    recognitionRef.current.onresult = (event: any) => {
      // Skip processing if muted or speaking
      if (isMuted || isSpeaking || isAudioProcessingRef.current) return

      lastSpeechRef.current = Date.now()

      // Get the transcript
      let finalTranscript = ""
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      const transcript = finalTranscript || interimTranscript
      setTranscription(transcript)

      // Reset silence detection timer
      if (silenceTimer) {
        clearTimeout(silenceTimer)
      }

      // Set a new silence detection timer
      const timer = setTimeout(() => {
        if (transcript.trim() && Date.now() - lastSpeechRef.current >= 1500 && !isMuted && !isSpeaking && !isAudioProcessingRef.current) {
          stopRecognition()
          handleSendVoice(transcript)
        }
      }, 1500)

      setSilenceTimer(timer)
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)

      if (event.error !== "no-speech") {
        toast({
          title: "Speech Recognition Error",
          description: `An error occurred: ${event.error}`,
          variant: "destructive",
        })
      }

      setIsListening(false)

      // Try to restart after an error
      if (isActive && !isMuted && !isProcessing && !isSpeaking && !isAudioProcessingRef.current) {
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current)
        }

        restartTimeoutRef.current = setTimeout(() => {
          setupAndStartRecognition()
        }, 1000)
      }
    }

    recognitionRef.current.onend = () => {
      console.log("Speech recognition ended")
      setIsListening(false)

      if (listeningTimerRef.current) {
        clearInterval(listeningTimerRef.current)
        listeningTimerRef.current = null
      }

      // Try to restart if it ended unexpectedly and we're not speaking
      if (isActive && !isMuted && !isProcessing && !isSpeaking && !isAudioProcessingRef.current) {
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current)
        }

        restartTimeoutRef.current = setTimeout(() => {
          console.log("Restarting recognition after it ended unexpectedly")
          setupAndStartRecognition()
        }, 1000)
      }
    }

    // Start recognition
    try {
      console.log("Starting speech recognition")
      recognitionRef.current.start()
    } catch (error) {
      console.error("Error starting speech recognition:", error)

      // If already started, just update state
      if (error instanceof Error && error.message.includes("already started")) {
        setIsListening(true)
      } else {
        // Try again after a delay
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current)
        }

        restartTimeoutRef.current = setTimeout(() => {
          setupAndStartRecognition()
        }, 1000)
      }
    }
  }

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try {
        // Remove event handlers to prevent callbacks
        const tempRecognition = recognitionRef.current
        recognitionRef.current = null

        tempRecognition.onend = null
        tempRecognition.onstart = null
        tempRecognition.onerror = null
        tempRecognition.onresult = null

        tempRecognition.stop()
        console.log("Speech recognition stopped")
      } catch (e) {
        console.error("Error stopping speech recognition:", e)
      }
    }

    setIsListening(false)

    if (listeningTimerRef.current) {
      clearInterval(listeningTimerRef.current)
      listeningTimerRef.current = null
    }

    if (silenceTimer) {
      clearTimeout(silenceTimer)
      setSilenceTimer(null)
    }
  }

  const cleanupSpeechRecognition = () => {
    stopRecognition()

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }
  }

  // Generate audio visualization when speaking
  useEffect(() => {
    if (isSpeaking) {
      const generateVisualization = () => {
        const newVisualization = Array.from({ length: 50 }, () => Math.random() * 50 + 10)
        setAudioVisualization(newVisualization)
        animationFrameRef.current = requestAnimationFrame(generateVisualization)
      }

      generateVisualization()

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    } else {
      setAudioVisualization([])
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isSpeaking])

  const handleSendVoice = async (text: string) => {
    if (!text.trim() || !isActive) return

    setIsProcessing(true)
    const currentText = text.trim()

    // Add user message to conversation immediately
    setConversationHistory((prev) => [...prev, { role: "user", content: currentText }])

    // Clear transcription
    setTranscription("")

    // Reset audio queue
    audioChunksRef.current = []
    isAudioProcessingRef.current = true
    isPlayingRef.current = false

    try {
      // Send the message to the server
      await sendConversationMessage(currentText, conversationId)

      // Note: We don't need to handle the response here as it will come through WebSocket
    } catch (error: any) {
      console.error("Conversation error:", error)
      toast({
        title: "Conversation Error",
        description: `Failed to get response: ${error.message}`,
        variant: "destructive",
      })

      // Reset audio processing state
      isAudioProcessingRef.current = false

      // Restart listening if there was an error and we're still active
      if (isActive && !isMuted) {
        setTimeout(() => {
          setupAndStartRecognition()
        }, 1000)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)

    if (newMutedState) {
      // Muting
      toast({
        title: "Microphone Muted",
        description: "The system will not listen to your voice until unmuted.",
      })

      // Stop listening immediately
      stopRecognition()

      // Also stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        setIsSpeaking(false)
        isPlayingRef.current = false
      }
    } else {
      // Unmuting
      toast({
        title: "Microphone Unmuted",
        description: "The system will now listen to your voice.",
      })

      // Start listening after a short delay if not speaking
      if (!isSpeaking && !isAudioProcessingRef.current) {
        setTimeout(() => {
          setupAndStartRecognition()
        }, 500)
      }
    }
  }

  // Function to handle script type selection
  const handleScriptTypeChange = (scriptType: string) => {
    setSelectedScriptType(scriptType)
    setIsDropdownOpen(false)
  }

  // Function to start the call
  const handleStartCall = () => {
    setIsActive(true)

    // Reset response counter
    responseCountRef.current = 0

    // Send the selected script type to the server
    setScriptType(selectedScriptType)

    // Start listening after a short delay
    setTimeout(() => {
      setupAndStartRecognition()
    }, 500)

    toast({
      title: "Call Started",
      description: `Using ${SCRIPT_TYPES.find((s) => s.id === selectedScriptType)?.name} script.`,
    })
  }

  // Function to handle ending the call
  const handleEndCall = () => {
    setIsActive(false)
    cleanupSpeechRecognition()

    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      setIsSpeaking(false)
    }

    // Reset conversation
    setConversationHistory([])
    setConversationId(null)
    audioChunksRef.current = []
    isAudioProcessingRef.current = false
    isPlayingRef.current = false
    responseCountRef.current = 0

    // Call the parent component's onEndCall if provided
    if (onEndCall) {
      onEndCall()
    }

    toast({
      title: "Call Ended",
      description: "Voice call has been terminated.",
    })
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="max-w-3xl mx-auto">
        {/* Header with back button */}
        {/* Main content */}
        <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
          {/* Title */}
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <h1 className="text-xl font-semibold text-blue-400">AI Voice Conversation</h1>
          </div>

          {/* Script Type Selector - Only visible when call is not active */}
          {!isActive && (
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">Select Script Type</h2>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"
                >
                  <div>
                    <span className="font-medium">{SCRIPT_TYPES.find((s) => s.id === selectedScriptType)?.name}</span>
                    <p className="text-sm text-slate-400">
                      {SCRIPT_TYPES.find((s) => s.id === selectedScriptType)?.description}
                    </p>
                  </div>
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg">
                    {SCRIPT_TYPES.map((script) => (
                      <button
                        key={script.id}
                        onClick={() => handleScriptTypeChange(script.id)}
                        className={cn(
                          "w-full text-left px-4 py-2 hover:bg-slate-600",
                          selectedScriptType === script.id && "bg-slate-600",
                        )}
                      >
                        <span className="font-medium">{script.name}</span>
                        <p className="text-sm text-slate-400">{script.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleStartCall}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Start Call
              </button>
            </div>
          )}

          {/* Call Controls - Only visible when call is active */}
          {isActive && (
            <div className="flex items-center justify-center gap-3 mb-6">
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full",
                  isMuted
                    ? "bg-orange-900/30 text-orange-300"
                    : isListening
                      ? "bg-green-900/30 text-green-300"
                      : isProcessing
                        ? "bg-yellow-900/30 text-yellow-300"
                        : isSpeaking
                          ? "bg-blue-900/30 text-blue-300"
                          : "bg-slate-700 text-slate-300",
                )}
              >
                {isMuted && (
                  <>
                    <VolumeX className="h-4 w-4" />
                    <span>Microphone Muted</span>
                  </>
                )}
                {!isMuted && isListening && (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>Listening... {formatTime(listeningDuration)}</span>
                  </>
                )}
                {isProcessing && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                )}
                {isSpeaking && (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span>AI Speaking...</span>
                  </>
                )}
                {!isMuted && !isListening && !isProcessing && !isSpeaking && !isAudioProcessingRef.current && (
                  <>
                    <div className="h-2 w-2 rounded-full bg-slate-500"></div>
                    <span>Idle</span>
                  </>
                )}
                {!isMuted && !isListening && !isProcessing && !isSpeaking && isAudioProcessingRef.current && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Preparing Audio...</span>
                  </>
                )}
              </div>

              <button
                onClick={toggleMute}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-white",
                  isMuted ? "bg-orange-600 hover:bg-orange-700" : "bg-red-600 hover:bg-red-700",
                )}
              >
                {isMuted ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                <span>{isMuted ? "Unmute" : "Mute"}</span>
              </button>
            </div>
          )}

          {/* Transcription Display */}
          {transcription && isActive && !isMuted && (
            <div className="bg-slate-700/60 p-4 rounded-lg mb-6">
              <p className="font-medium mb-1 text-slate-300">Current transcription:</p>
              <p className="italic text-slate-400">{transcription}</p>
            </div>
          )}

          {/* Conversation History */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-6 h-[300px] overflow-y-auto">
            {conversationHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                {!isActive ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                      <Phone className="h-10 w-10 text-blue-400" />
                    </div>
                    <p className="text-lg font-medium mb-2">Ready to Start a Conversation</p>
                    <p className="text-sm text-center max-w-md">
                      Click the Start Call button to begin talking with the AI assistant. The system will automatically
                      listen to you and respond.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-2">Your conversation will appear here.</p>
                    <p className="text-sm">
                      {isMuted ? "Unmute your microphone to start speaking" : "Start speaking to begin..."}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {conversationHistory.map((message, index) => (
                  <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3",
                        message.role === "user" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-200",
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                <div ref={conversationEndRef} />
              </div>
            )}
          </div>

          {/* Audio Visualization (simplified) */}
          {isSpeaking && (
            <div className="h-12 w-full flex items-center justify-center gap-[2px] bg-slate-700/60 rounded-lg overflow-hidden">
              {audioVisualization.map((height, index) => (
                <div key={index} className="w-1 bg-blue-500 rounded-full" style={{ height: `${height}%` }} />
              ))}
            </div>
          )}

          {/* Audio element */}
          <audio ref={audioRef} preload="auto" />
        </div>
      </div>
    </div>
  )
}
