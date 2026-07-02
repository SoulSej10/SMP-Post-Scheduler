"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Facebook, Instagram, Linkedin, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { getSessionUser, getSocialAccounts, disconnectSocialAccount, type SocialAccount } from "@/lib/storage"
import type { Platform } from "@/lib/types"

const PLATFORMS: Platform[] = ["facebook", "instagram", "linkedin"]

export default function SocialAccountBinding() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const user = await getSessionUser()
    if (!user?.currentCompanyId) return
    setCompanyId(user.currentCompanyId)
    setLoading(true)
    const list = await getSocialAccounts(user.currentCompanyId)
    setAccounts(list)
    setLoading(false)
  }

  const getAccount = (platform: Platform) => accounts.find((a) => a.platform === platform)

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="h-5 w-5 text-blue-600" />
      case "instagram":
        return <Instagram className="h-5 w-5 text-pink-600" />
      case "linkedin":
        return <Linkedin className="h-5 w-5 text-blue-700" />
    }
  }

  const getPlatformName = (platform: Platform) => platform.charAt(0).toUpperCase() + platform.slice(1)

  const handleConnect = (platform: Platform) => {
    if (!companyId) return
    // Instagram business accounts are discovered through the Facebook connection
    const oauthPlatform = platform === "instagram" ? "facebook" : platform
    window.location.href = `/api/oauth/${oauthPlatform}/connect?companyId=${encodeURIComponent(companyId)}`
  }

  const handleDisconnect = async (account: SocialAccount) => {
    setDisconnecting(account.id)
    const success = await disconnectSocialAccount(account.id)
    if (success) await load()
    setDisconnecting(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Accounts</CardTitle>
        <CardDescription>
          Connect your accounts to publish posts directly to Facebook, Instagram, and LinkedIn.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {PLATFORMS.map((platform) => {
          const account = getAccount(platform)
          const connected = account?.connected ?? false

          return (
            <div key={platform} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {getPlatformIcon(platform)}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="font-medium">{getPlatformName(platform)}</span>
                    {connected ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 w-fit">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 w-fit">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not connected
                      </Badge>
                    )}
                  </div>
                  {connected && account?.username && (
                    <p className="text-sm text-muted-foreground truncate">{account.username}</p>
                  )}
                  {platform === "instagram" && !connected && (
                    <p className="text-xs text-muted-foreground">Connected automatically via Facebook</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {connected && account ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(account)}
                    disabled={disconnecting === account.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {disconnecting === account.id ? "Disconnecting..." : "Disconnect"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(platform)}
                    disabled={loading || !companyId}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
          )
        })}

        <div className="mt-4 p-4 bg-accent rounded-lg border border-green-200 dark:border-green-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-accent-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-accent-foreground">About connecting accounts</p>
              <p className="text-accent-foreground/80 mt-1">
                Connecting redirects you to Facebook or LinkedIn to authorize Gazetta. Access tokens are stored
                server-side and are never sent to your browser. If a "Connect" button reports the platform isn't
                configured, the app owner needs to add API credentials in the server environment first.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
