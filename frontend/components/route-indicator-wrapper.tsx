"use client"

import { Suspense, useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Import the AnimatedRouteIndicator with dynamic to disable SSR
const AnimatedRouteIndicator = dynamic(
  () => import("./animated-route-indicator").then((mod) => ({ default: mod.AnimatedRouteIndicator })),
  { ssr: false },
)

export function RouteIndicatorWrapper() {
  // Use client-side only rendering
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <AnimatedRouteIndicator />
    </Suspense>
  )
}

