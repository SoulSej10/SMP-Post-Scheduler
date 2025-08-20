"use client"

import type React from "react"

import { Loader2 } from "lucide-react"

type Props = {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className = "" }: Props) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
}

export function LoadingOverlay({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-md">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  )
}
