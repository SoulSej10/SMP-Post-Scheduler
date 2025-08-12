"use client"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../../components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Button } from "../../components/ui/button"
import { getSessionUser, getSettings, saveSettings } from "@/lib/storage"
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2 border-b bg-background px-4 py-2">
          <SidebarTrigger />
          <h1 className="text-base font-medium">Settings</h1>
        </div>
        {/* Logic code */}
      </SidebarInset>
    </SidebarProvider>
  )
}
