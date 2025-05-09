"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import UploadForm from "@/components/upload-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion } from "framer-motion"

export default function Home() {
  const router = useRouter()

  const [pageKey, setPageKey] = useState(0)
  useEffect(() => {
    // Force re-render when component mounts
    setPageKey((prev) => prev + 1)
  }, [])

  // Add a new useEffect to handle navigation events
  useEffect(() => {
    // Add event listener for route changes
    const handleRouteChange = () => {
      // Reset any state if needed when navigating
    }

    window.addEventListener("beforeunload", handleRouteChange)

    return () => {
      window.removeEventListener("beforeunload", handleRouteChange)
    }
  }, [])

  return (
    <motion.div
      key={pageKey}
      className="min-h-screen transition-colors duration-300 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="noise"></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.08)_0%,_transparent_50%)] animate-gradient"></div>
      </div>

      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-md transition-all duration-300">
        <div className="container flex h-16 items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Icon-swk7WBmbgmNpfLAhcW7L0zgvSEnqeu.png"
                alt="FINOVA Logo"
                width={40}
                height={40}
                className="h-10 w-auto transition-transform hover:scale-105"
                style={{ objectFit: "contain" }}
              />
            </div>
          </motion.div>
          <motion.nav
            className="flex items-center gap-6"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <button
              onClick={(e) => {
                e.preventDefault()
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
            </button>

            <button
              onClick={(e) => {
                e.preventDefault()
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
            </button>
            <ThemeToggle />
          </motion.nav>
        </div>
      </header>

      <motion.main className="container py-8 md:py-12">
        <motion.section
          className="py-8 md:py-12 lg:py-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mx-auto max-w-4xl text-center relative">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-black/10 rounded-full blur-3xl opacity-50 animate-pulse-custom"></div>
            <motion.h1
              className="animate-fade-up text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl gradient-text"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2, type: "spring" }}
            >
              Chat with our AI voice assistant!
            </motion.h1>
            <motion.p
              className="mt-6 text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            ></motion.p>
            <motion.div
              className="mt-8 flex justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            ></motion.div>
          </div>

          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
          >
            <UploadForm />
          </motion.div>
        </motion.section>

        <motion.section
          id="features"
          className="py-16 md:py-20 relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="absolute -top-40 right-0 w-72 h-72 bg-black/5 rounded-full blur-3xl opacity-70 animate-float"></div>
        </motion.section>
      </motion.main>

      <motion.footer
        className="border-t bg-muted/40 transition-colors duration-300 relative overflow-hidden mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none"></div>
        <div className="container flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Icon-swk7WBmbgmNpfLAhcW7L0zgvSEnqeu.png"
                alt="FINOVA Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
                style={{ objectFit: "contain" }}
              />
            </div>
            <span className="text-lg font-semibold">FINOVA</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 FINOVA. All rights reserved.</p>
        </div>
      </motion.footer>
    </motion.div>
  )
}

