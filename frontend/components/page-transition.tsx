"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { type ReactNode, useEffect, useState } from "react"

interface PageTransitionProps {
  children: ReactNode
}

const variants = {
  hidden: { opacity: 0, x: 0, y: 20 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 0, y: -20 },
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isFirstMount, setIsFirstMount] = useState(true)

  // Track first mount to optimize initial load
  useEffect(() => {
    if (isFirstMount) {
      // Disable animations on first load
      setIsFirstMount(false)
    }
  }, [isFirstMount])

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={isFirstMount ? false : "hidden"}
        animate="enter"
        exit="exit"
        variants={variants}
        transition={{
          duration: 0.3,
          type: "spring",
          stiffness: 100,
          damping: 15,
        }}
        className="min-h-screen"
      >
        {!isFirstMount && (
          <>
            {/* Animated page overlay - with safety timeout */}
            <motion.div
              className="fixed inset-0 z-50 bg-primary pointer-events-none"
              initial={{ scaleY: 1 }}
              animate={{ scaleY: 0 }}
              exit={{ scaleY: 1 }}
              transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
                // Add a max duration to prevent getting stuck
                maxDuration: 0.8,
              }}
              style={{ transformOrigin: "top" }}
            />

            {/* Animated page overlay (delayed) - with safety timeout */}
            <motion.div
              className="fixed inset-0 z-40 bg-background pointer-events-none"
              initial={{ scaleY: 1 }}
              animate={{ scaleY: 0 }}
              exit={{ scaleY: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.05,
                ease: [0.22, 1, 0.36, 1],
                // Add a max duration to prevent getting stuck
                maxDuration: 0.8,
              }}
              style={{ transformOrigin: "top" }}
            />
          </>
        )}

        {children}

        {!isFirstMount && (
          <>
            {/* Exit animations - with safety timeout */}
            <motion.div
              className="fixed inset-0 z-40 bg-background pointer-events-none"
              initial={{ scaleY: 0 }}
              exit={{ scaleY: 1 }}
              transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
                // Add a max duration to prevent getting stuck
                maxDuration: 0.8,
              }}
              style={{ transformOrigin: "bottom" }}
            />

            <motion.div
              className="fixed inset-0 z-50 bg-primary pointer-events-none"
              initial={{ scaleY: 0 }}
              exit={{ scaleY: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.05,
                ease: [0.22, 1, 0.36, 1],
                // Add a max duration to prevent getting stuck
                maxDuration: 0.8,
              }}
              style={{ transformOrigin: "bottom" }}
            />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

