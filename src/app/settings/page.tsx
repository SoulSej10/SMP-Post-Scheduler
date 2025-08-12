"use client"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../../components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Button } from "../../components/ui/button"
import { getSessionUser, getSettings, saveSettings, logoutLocal } from "@/lib/storage"
import { useEffect, useState } from "react"

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

  const onLogout = () => {
    logoutLocal()
    router.push("/login")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2 border-b bg-background px-4 py-2">
          <SidebarTrigger />
          <h1 className="text-base font-medium">Settings</h1>
        </div>
        <main className="container mx-auto p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrations and Connections</CardTitle>
              <CardDescription>
                Configure outbound automation to n8n. Connect social media accounts here to trigger scheduled posts.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Logout Button */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={onLogout}>
                Logout
              </Button>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
