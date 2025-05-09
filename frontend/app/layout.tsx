import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { PageTransition } from "@/components/page-transition"
import { RouteIndicatorWrapper } from "@/components/route-indicator-wrapper"

import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FINOVA - Voice to Text to Voice",
  description: "Transform Voice to Text to Voice with AI",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <RouteIndicatorWrapper />
          <PageTransition>{children}</PageTransition>
          <div
            id="page-transition-overlay"
            className="fixed inset-0 pointer-events-none z-[100] bg-background opacity-0 transition-opacity duration-300"
          />
        </ThemeProvider>
      </body>
    </html>
  )
}

