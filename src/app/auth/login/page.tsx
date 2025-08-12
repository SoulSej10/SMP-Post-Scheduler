"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { getSessionUser, loginLocal, getUsers } from "@/lib/storage"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("demo@example.com")
  const [password, setPassword] = useState("demo1234")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const u = getSessionUser()
    if (u) router.push("/")
  }, [router])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ok = loginLocal(email, password)
    if (!ok) {
      setError("Invalid email or password")
      return
    }
    router.push("/")
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Use your account to access the scheduler.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              Login
            </Button>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link href="/register" className="underline">
                Register
              </Link>
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              Existing users:{" "}
              {getUsers().length > 0
                ? getUsers()
                    .map((u) => u.email)
                    .join(", ")
                : "none"}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
