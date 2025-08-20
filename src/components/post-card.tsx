"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { sendToN8n } from "@/lib/storage"
import type { Post } from "@/lib/types"

type Props = {
  post: Post
  onSent?: (ok: boolean) => void
}

export default function PostCard({ post, onSent }: Props) {
  const [sending, setSending] = React.useState(false)
  const [status, setStatus] = React.useState<"idle" | "ok" | "fail">("idle")

  const handleSend = async () => {
    setSending(true)
    const ok = await sendToN8n(post)
    setStatus(ok ? "ok" : "fail")
    setSending(false)
    onSent?.(ok)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">
          <Badge variant="outline" className="uppercase">
            {post.platform.slice(0, 2)}
          </Badge>{" "}
          {new Date(post.scheduledAt).toLocaleString()}
        </CardTitle>
        <Badge variant={post.status === "scheduled" ? "secondary" : "outline"}>{post.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {post.imageUrl && (
          <img
            src={post.imageUrl || "/placeholder.svg"}
            alt="Post image"
            className="h-40 w-full rounded-md object-cover"
            cross-origin="anonymous"
          />
        )}
        <p className="text-sm">{post.content}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSend} disabled={sending}>
            {sending ? "Sending..." : "Send to n8n"}
          </Button>
          {status === "ok" && <span className="text-xs text-green-600">Sent!</span>}
          {status === "fail" && <span className="text-xs text-destructive">Failed</span>}
        </div>
      </CardContent>
    </Card>
  )
}
