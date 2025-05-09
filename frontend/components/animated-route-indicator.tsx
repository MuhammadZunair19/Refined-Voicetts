"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { useEffect, useState, useRef } from "react"

export function AnimatedRouteIndicator() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isChanging, setIsChanging] = useState(false)
  const [prevPathname, setPrevPathname] = useState("")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track route changes by comparing current and previous paths
  useEffect(() => {
    // Only trigger on actual route changes, not initial load
    if (prevPathname && prevPathname !== pathname) {
      setIsChanging(true)

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set a timeout to hide the indicator
      timeoutRef.current = setTimeout(() => {
        setIsChanging(false)
      }, 800)

      // Set a safety timeout to ensure it always gets hidden
      const safetyTimeout = setTimeout(() => {
        setIsChanging(false)
      }, 3000)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        clearTimeout(safetyTimeout)
      }
    }

    setPrevPathname(pathname)
  }, [pathname, prevPathname, searchParams])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (!isChanging) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 1.5, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1, 0] }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="w-24 h-24 rounded-full bg-primary/40 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-primary/60 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-8 h-8 rounded-full bg-primary"
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Add a progress bar at the top for additional visual feedback */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary"
        initial={{ scaleX: 0, transformOrigin: "left" }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
    </div>
  )
}

