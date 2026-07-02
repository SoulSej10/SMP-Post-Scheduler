"use client"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getSessionUser } from "@/lib/storage"
import { useEffect, useState } from "react"
import { CheckCircle, AlertCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import SocialAccountBinding from "@/components/social-account-binding"
import CompanyManagementCard from "@/components/company-management-card"

function ConnectionBanner() {
  const searchParams = useSearchParams()
  const connected = searchParams.get("connected")
  const connectError = searchParams.get("connectError")

  if (!connected && !connectError) return null

  if (connectError) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border bg-red-50 border-red-200 text-red-700 text-sm">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        {connectError}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border bg-green-50 border-green-200 text-green-700 text-sm">
      <CheckCircle className="h-4 w-4 flex-shrink-0" />
      Connected: {connected}
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    getSessionUser().then((user) => {
      if (!user) router.push("/login")
    })
  }, [router])

  return (
    <SidebarProvider>
      <Suspense fallback={<div>Loading sidebar...</div>}>
        <AppSidebar />
      </Suspense>
      <SidebarInset>
        <div className="flex items-center gap-2 border-b bg-background px-4 py-2">
          <SidebarTrigger />
          <h1 className="text-base font-medium">Settings</h1>
        </div>
        <main className="container mx-auto p-4 space-y-6">
          <Suspense fallback={null}>
            <ConnectionBanner />
          </Suspense>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the application looks and feels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Theme</Label>
                  <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          <Separator />

          <CompanyManagementCard />

          <Separator />

          {/* Social Media Account Binding */}
          <SocialAccountBinding />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
