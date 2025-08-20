"use client"

import { useEffect, useState } from "react"

type Props = {
  progress: number
  className?: string
  showPercentage?: boolean
}

export function ProgressBar({ progress, className = "", showPercentage = true }: Props) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress)
    }, 100)
    return () => clearTimeout(timer)
  }, [progress])

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Creating posts...</span>
        {showPercentage && <span className="text-sm text-gray-500">{Math.round(displayProgress)}%</span>}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${displayProgress}%` }}
        />
      </div>
    </div>
  )
}
