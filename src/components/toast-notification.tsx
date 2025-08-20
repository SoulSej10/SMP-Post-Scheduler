"use client"

import type React from "react"

import { useState } from "react"
import { CheckCircle, XCircle, Info, AlertCircle } from "lucide-react"

type ToastType = "success" | "error" | "info" | "warning"

type Toast = {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

type ToastContextType = {
  showToast: (toast: Omit<Toast, "id">) => void
}

let toastContext: ToastContextType | null = null

export function useToast() {
  return toastContext!
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2)
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])

    // Auto remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, toast.duration || 4000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  toastContext = { showToast }

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800"
      case "error":
        return "bg-red-50 border-red-200 text-red-800"
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800"
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800"
    }
  }

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm animate-in slide-in-from-right-full ${getStyles(toast.type)}`}
          >
            {getIcon(toast.type)}
            <div className="flex-1">
              <div className="font-medium">{toast.title}</div>
              {toast.message && <div className="text-sm mt-1">{toast.message}</div>}
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600 ml-2">
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
