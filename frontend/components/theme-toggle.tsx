"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="opacity-0">
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full transition-all hover:bg-primary/10 relative overflow-hidden group"
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full scale-0 group-hover:scale-100 duration-300"></div>
      {theme === "dark" ? (
        <Moon className="h-5 w-5 transition-all animate-in fade-in relative z-10" />
      ) : (
        <Sun className="h-5 w-5 transition-all animate-in fade-in relative z-10" />
      )}
    </Button>
  )
}

