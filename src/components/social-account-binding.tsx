"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Facebook, Instagram, Linkedin, CheckCircle, AlertCircle, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type SocialAccount = {
  platform: "facebook" | "instagram" | "linkedin"
  connected: boolean
  username?: string
  lastSync?: string
}

export default function SocialAccountBinding() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    { platform: "facebook", connected: false },
    { platform: "instagram", connected: true, username: "@mycompany", lastSync: "2 hours ago" },
    { platform: "linkedin", connected: false },
  ])

  const [bindingAccount, setBindingAccount] = useState<"facebook" | "instagram" | "linkedin" | null>(null)
  const [credentials, setCredentials] = useState({ username: "", accessToken: "" })

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
          <div key={account.platform} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {getPlatformIcon(account.platform)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getPlatformName(account.platform)}</span>
                  {account.connected ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  )}
                </div>
                {account.connected && account.username && (
                  <p className="text-sm text-muted-foreground">
                    {account.username} • Last sync: {account.lastSync}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                  <DialogContent>
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
        ))}

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Security Notice</p>
              <p className="text-blue-700 mt-1">
                Your social media credentials are encrypted and stored securely. We only use them to post content on
                your behalf when you schedule posts.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
