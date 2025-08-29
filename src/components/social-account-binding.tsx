"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Facebook,
  Instagram,
  Linkedin,
  CheckCircle,
  AlertCircle,
  Plus,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SocialAccount = {
  platform: "facebook" | "instagram" | "linkedin"
  connected: boolean
  username?: string
  lastSync?: string
  scheduleDays?: string[]
  scheduleTime?: string // Added time selection for posts
}

const WEEKDAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
]

const TIME_OPTIONS = [
  "06:00 AM",
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
  "11:00 PM",
]

export default function SocialAccountBinding() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    {
      platform: "facebook",
      connected: false,
      scheduleDays: ["monday", "wednesday", "friday"],
      scheduleTime: "10:00 AM",
    },
    {
      platform: "instagram",
      connected: true,
      username: "@mycompany",
      lastSync: "2 hours ago",
      scheduleDays: ["tuesday", "thursday", "saturday"],
      scheduleTime: "02:00 PM",
    },
    {
      platform: "linkedin",
      connected: false,
      scheduleDays: ["monday", "tuesday", "wednesday"],
      scheduleTime: "09:00 AM",
    },
  ])

  const [bindingAccount, setBindingAccount] = useState<"facebook" | "instagram" | "linkedin" | null>(null)
  const [credentials, setCredentials] = useState({ username: "", accessToken: "" })
  const [expandedSchedule, setExpandedSchedule] = useState<"facebook" | "instagram" | "linkedin" | null>(null)

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="h-5 w-5 text-blue-600" />
      case "instagram":
        return <Instagram className="h-5 w-5 text-pink-600" />
      case "linkedin":
        return <Linkedin className="h-5 w-5 text-blue-700" />
      default:
        return null
    }
  }

  const getPlatformName = (platform: string) => {
    return platform.charAt(0).toUpperCase() + platform.slice(1)
  }

  const handleConnect = (platform: "facebook" | "instagram" | "linkedin") => {
    setBindingAccount(platform)
    setCredentials({ username: "", accessToken: "" })
  }

  const handleBind = () => {
    if (!bindingAccount) return

    // Simulate API call
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.platform === bindingAccount
          ? { ...acc, connected: true, username: credentials.username, lastSync: "Just now" }
          : acc,
      ),
    )

    setBindingAccount(null)
    setCredentials({ username: "", accessToken: "" })
  }

  const handleDisconnect = (platform: "facebook" | "instagram" | "linkedin") => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.platform === platform ? { ...acc, connected: false, username: undefined, lastSync: undefined } : acc,
      ),
    )
  }

  const handleScheduleDayChange = (platform: "facebook" | "instagram" | "linkedin", day: string, checked: boolean) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.platform === platform) {
          const currentDays = acc.scheduleDays || []
          const newDays = checked ? [...currentDays, day] : currentDays.filter((d) => d !== day)
          return { ...acc, scheduleDays: newDays }
        }
        return acc
      }),
    )
  }

  const handleScheduleTimeChange = (platform: "facebook" | "instagram" | "linkedin", time: string) => {
    setAccounts((prev) => prev.map((acc) => (acc.platform === platform ? { ...acc, scheduleTime: time } : acc)))
  }

  const toggleScheduleSection = (platform: "facebook" | "instagram" | "linkedin") => {
    setExpandedSchedule(expandedSchedule === platform ? null : platform)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Accounts</CardTitle>
        <CardDescription>
          Connect your social media accounts to enable automated posting. Your credentials are stored securely.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.map((account) => (
          <div key={account.platform} className="border rounded-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {getPlatformIcon(account.platform)}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="font-medium">{getPlatformName(account.platform)}</span>
                    {account.connected ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 w-fit">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 w-fit">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  {account.connected && account.username && (
                    <p className="text-sm text-muted-foreground truncate">
                      {account.username} • Last sync: {account.lastSync}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleScheduleSection(account.platform)}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Schedule</span>
                  {expandedSchedule === account.platform ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {account.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(account.platform)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Dialog
                    open={bindingAccount === account.platform}
                    onOpenChange={(open) => !open && setBindingAccount(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnect(account.platform)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Connect
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          {getPlatformIcon(account.platform)}
                          Connect {getPlatformName(account.platform)} Account
                        </DialogTitle>
                        <DialogDescription>
                          Enter your {getPlatformName(account.platform)} credentials to enable automated posting.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username/Page Name</Label>
                          <Input
                            id="username"
                            placeholder={`Your ${account.platform} username or page name`}
                            value={credentials.username}
                            onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="accessToken">Access Token</Label>
                          <Input
                            id="accessToken"
                            type="password"
                            placeholder="Your API access token"
                            value={credentials.accessToken}
                            onChange={(e) => setCredentials((prev) => ({ ...prev, accessToken: e.target.value }))}
                          />
                          <p className="text-xs text-muted-foreground">
                            Get your access token from the {getPlatformName(account.platform)} Developer Portal
                          </p>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setBindingAccount(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleBind} disabled={!credentials.username || !credentials.accessToken}>
                            Connect Account
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {expandedSchedule === account.platform && (
              <div className="border-t bg-gray-50/50 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{getPlatformName(account.platform)} Schedule Settings</h4>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Posting Time</Label>
                  </div>
                  <Select
                    value={account.scheduleTime || "10:00 AM"}
                    onValueChange={(time) => handleScheduleTimeChange(account.platform, time)}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Posting Days</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose which days of the week this platform should receive posts when generating schedules.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {WEEKDAYS.map((day) => (
                      <label key={day.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={account.scheduleDays?.includes(day.value) || false}
                          onCheckedChange={(checked) =>
                            handleScheduleDayChange(account.platform, day.value, Boolean(checked))
                          }
                        />
                        <span className="text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>

                  {account.scheduleDays && account.scheduleDays.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ No days selected. This platform won't receive any scheduled posts.
                    </p>
                  )}
                </div>

                {account.scheduleDays && account.scheduleDays.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      <strong>Current Schedule:</strong> Posts will be published on{" "}
                      {account.scheduleDays.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(", ")} at{" "}
                      {account.scheduleTime || "10:00 AM"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">About Pen Master</p>
              <p className="text-blue-700 mt-1">
                Pen Master is your intelligent social media scheduling assistant. Configure platform-specific posting
                days above to optimize your content distribution. Your credentials are encrypted and stored securely -
                we only use them to post content when you schedule posts.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
