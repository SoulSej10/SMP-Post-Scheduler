"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, Share2, Eye } from "lucide-react"
import { sendToN8n } from "@/lib/storage"
import { useState } from "react"
import type { Post } from "@/lib/types"

type Props = {
  posts: Post[]
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
}

export default function PostViewModal({ posts, open, onOpenChange, title }: Props) {
  const [sendingStates, setSendingStates] = useState<Record<string, boolean>>({})
  const [sentStates, setSentStates] = useState<Record<string, "ok" | "fail" | null>>({})

  const handleSendToN8n = async (post: Post) => {
    setSendingStates((prev) => ({ ...prev, [post.id]: true }))
    const success = await sendToN8n(post)
    setSendingStates((prev) => ({ ...prev, [post.id]: false }))
    setSentStates((prev) => ({ ...prev, [post.id]: success ? "ok" : "fail" }))

    // Clear status after 3 seconds
    setTimeout(() => {
      setSentStates((prev) => ({ ...prev, [post.id]: null }))
    }, 3000)
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "facebook":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "instagram":
        return "bg-pink-100 text-pink-800 border-pink-200"
      case "linkedin":
        return "bg-blue-100 text-blue-900 border-blue-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "posted":
        return "bg-green-100 text-green-800 border-green-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {title || `Viewing ${posts.length} Post${posts.length !== 1 ? "s" : ""}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Image Section */}
                    {post.imageUrl && (
                      <div className="lg:w-1/3 bg-gray-50">
                        <img
                          src={post.imageUrl || "/placeholder.svg"}
                          alt="Post image"
                          className="w-full h-48 lg:h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      </div>
                    )}

                    {/* Content Section */}
                    <div className={`flex-1 p-6 ${!post.imageUrl ? "w-full" : ""}`}>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${getPlatformColor(post.platform)} border`}>
                            {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                          </Badge>
                          <Badge variant="outline" className={`${getStatusColor(post.status)} border`}>
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(post.scheduledAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(post.scheduledAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          {sentStates[post.id] === "ok" && (
                            <span className="text-xs text-green-600 font-medium">✓ Post it Now!</span>
                          )}
                          {sentStates[post.id] === "fail" && (
                            <span className="text-xs text-red-600 font-medium">✗ Failed to post</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendToN8n(post)}
                          disabled={sendingStates[post.id]}
                          className="flex items-center gap-2"
                        >
                          <Share2 className="h-4 w-4" />
                          {sendingStates[post.id] ? "Posting..." : "Post it Now!"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
