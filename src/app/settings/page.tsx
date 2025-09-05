"use client"
import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getSessionUser, getSettings, saveSettings } from "@/lib/storage"
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import SocialAccountBinding from "@/components/social-account-binding"
import CompanyManagementCard from "@/components/company-management-card"

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    const user = getSessionUser()
    if (!user) router.push("/login")
  }, [router])

  const [webhook, setWebhook] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const s = getSettings()
    if (s?.n8nWebhookUrl) setWebhook(s.n8nWebhookUrl)
  }, [])

  const onSave = () => {
    setSaving(true)
    saveSettings({ n8nWebhookUrl: webhook })
    setTimeout(() => setSaving(false), 400)
  }

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

          <Separator />

          {/* Integrations */}
          <Card>
            <CardHeader>
              <CardTitle>Automation & Integrations</CardTitle>
              <CardDescription>Configure external services and automation workflows.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
