"use client"

import { useState, useEffect } from "react"
import { VoiceCall } from "@/components/voice-call"
import { ArrowLeft, Phone, PhoneOff, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { isSpeechRecognitionSupported, formatTime } from "@/lib/utils"
import { navigateTo } from "@/lib/navigation-helper"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"

export default function CallPage() {
  const router = useRouter()
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isSupported, setIsSupported] = useState(true)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  const [pageKey, setPageKey] = useState(0)

  useEffect(() => {
    // Force re-render when component mounts
    setPageKey((prev) => prev + 1)

    // Clean up any active call state when navigating away
    return () => {
      if (isCallActive) {
        endCall()
      }
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [])

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== "undefined") {
      setIsSupported(isSpeechRecognitionSupported())
    }

    // Cleanup on component unmount
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [])

  useEffect(() => {
    if (isCallActive) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
      setTimerInterval(interval)

      return () => {
        clearInterval(interval)
      }
    } else if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
  }, [isCallActive])

  const startCall = () => {
    if (!isSupported) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome or Edge.",
        variant: "destructive",
      })
      return
    }

    setIsCallActive(true)
    setCallDuration(0)
    toast({
      title: "Call Started",
      description: "You can now speak with the AI assistant. Just start talking!",
    })
  }

  const endCall = () => {
    setIsCallActive(false)
    toast({
      title: "Call Ended",
      description: `Call duration: ${formatTime(callDuration)}`,
    })
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.6,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 10 },
    },
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="noise"></div>

      {/* Header */}
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-md transition-all duration-300">
        <div className="container flex h-16 items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Icon-swk7WBmbgmNpfLAhcW7L0zgvSEnqeu.png"
                alt="FINOVA Logo"
                width={40}
                height={40}
                className="h-10 w-auto transition-transform"
                style={{ objectFit: "contain" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </motion.div>
          <motion.nav
            className="flex items-center gap-6"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 100 }}
          >
            <ThemeToggle />
          </motion.nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {/* Call controls */}
          <div className="flex items-center justify-between mb-6 animate-fade-up">
            <button
              onClick={(e) => {
                e.preventDefault()
                navigateTo("/")
              }}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300/80 dark:hover:bg-slate-700/80 rounded-full px-4 py-2 transition-colors button-hover"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>

            {isCallActive && (
              <div className="flex items-center gap-3 animate-fade-in">
                <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-full">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Call in progress: {formatTime(callDuration)}</span>
                </div>
                <button
                  onClick={endCall}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-full px-4 py-2 transition-colors button-hover"
                >
                  <PhoneOff className="h-4 w-4" />
                  <span>End Call</span>
                </button>
              </div>
            )}

            {!isCallActive && (
              <button
                onClick={startCall}
                disabled={!isSupported}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-full px-4 py-2 transition-colors button-hover animate-fade-in"
              >
                <Phone className="h-4 w-4" />
                <span>Start Call</span>
              </button>
            )}
          </div>

          {/* Main content card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden glass card-hover animate-scale-in">
            {!isCallActive && (
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  {/* <Sparkles className="h-5 w-5 text-blue-500 animate-pulse-custom" /> */}
                  <h1 className="text-xl font-semibold gradient-text leading-none">AI Voice Conversation</h1>
                </div>

                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-8 animate-pulse-custom">
                    <Phone className="h-12 w-12 text-blue-500" />
                  </div>

                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    Ready to Start a Conversation
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-8">
                    Click the Start Call button to begin talking with the AI assistant. The system will automatically
                    listen to you and respond.
                  </p>

                  <button
                    onClick={startCall}
                    disabled={!isSupported}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-full px-6 py-3 transition-colors button-hover"
                  >
                    <Phone className="h-5 w-5" />
                    <span>Start Call</span>
                  </button>
                </div>

                {!isSupported && (
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg mt-6 border border-yellow-200 dark:border-yellow-800">
                    <p>
                      Your browser doesn't support speech recognition. Please use Chrome or Edge for the best
                      experience.
                    </p>
                  </div>
                )}
              </div>
            )}

            {isCallActive && <VoiceCall onEndCall={endCall} />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/40 transition-colors duration-300 relative overflow-hidden mt-8">
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none"></div>
        <motion.div
          className="container flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="flex items-center gap-3"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <motion.div
              className="relative"
              whileHover={{ rotate: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Icon-swk7WBmbgmNpfLAhcW7L0zgvSEnqeu.png"
                alt="FINOVA Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
                style={{ objectFit: "contain" }}
              />
            </motion.div>
            <span className="text-lg font-semibold gradient-text">FINOVA</span>
          </motion.div>
          <motion.p className="text-sm text-muted-foreground" variants={itemVariants}>
            © 2024 FINOVA. All rights reserved.
          </motion.p>
        </motion.div>
      </footer>
      <Toaster />
    </div>
  )
}

