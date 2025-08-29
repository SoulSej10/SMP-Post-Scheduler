import type React from "react"
import "./globals.css"
import { Rubik, Rubik_Bubbles } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
})

const rubikBubbles = Rubik_Bubbles({
  variable: "--font-rubik-bubbles",
  subsets: ["latin"],
  weight: "400",
})

export const metadata = {
  title: "Pen Master - Social Media Scheduler",
  description: "Schedule and manage your social media posts with ease using Pen Master.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${rubik.variable} ${rubikBubbles.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
