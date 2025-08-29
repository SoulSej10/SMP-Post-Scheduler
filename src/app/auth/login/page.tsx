"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PenTool, Eye, EyeOff, AlertCircle, Calendar, Zap, Shield } from "lucide-react"
import { getSessionUser, loginLocal, getUsers } from "@/lib/storage"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const u = getSessionUser()
    if (u) {
      if (u.onboardingCompleted) {
        router.push("/")
      } else {
        router.push("/onboarding")
      }
    }
  }, [router])

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const ok = loginLocal(email, password)
    if (!ok) {
      setErrors({ general: "Invalid email or password. Please check your credentials and try again." })
      setIsLoading(false)
      return
    }

    const user = getSessionUser()
    if (user?.onboardingCompleted) {
      router.push("/")
    } else {
      router.push("/onboarding")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl">
              <PenTool className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome to Pen Master</CardTitle>
            <CardDescription className="text-base mt-2">Sign in to your social media scheduler</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="demo@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                className={errors.email ? "border-red-500 focus:border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.email && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.email}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  className={`pr-10 ${errors.password ? "border-red-500 focus:border-red-500" : ""}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.password}
                </div>
              )}
            </div>

            {errors.general && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errors.general}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Create one here
                </Link>
              </p>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="text-sm">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Why Choose Pen Master?
                </h3>
                <div className="space-y-2 text-blue-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-blue-600" />
                    <span className="text-xs">Smart scheduling across Facebook, Instagram & LinkedIn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-blue-600" />
                    <span className="text-xs">AI-powered content generation with Gemini AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-blue-600" />
                    <span className="text-xs">Secure credential storage and automated posting</span>
                  </div>
                </div>
                {getUsers().length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs font-medium text-blue-800">Demo Account Available:</p>
                    <p className="text-xs text-blue-700">demo@example.com / demo1234</p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
