"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Post, Platform } from "@/lib/types"

type Props = {
  post: Post | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedPost: Post) => void
}

const ALL_PLATFORMS: Platform[] = ["facebook", "instagram", "linkedin"]

export default function EditPostModal({ post, open, onOpenChange, onSave }: Props) {
  const [content, setContent] = useState("")
  const [platform, setPlatform] = useState<Platform>("facebook")
  const [scheduledAt, setScheduledAt] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  useEffect(() => {
    if (post) {
      setContent(post.content)
      setPlatform(post.platform)
      setImageUrl(post.imageUrl || "")
      // Convert ISO string to datetime-local format
      const date = new Date(post.scheduledAt)
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      setScheduledAt(localDateTime)
    }
  }, [post])

  const handleSave = () => {
    if (!post) return

    // Convert datetime-local back to ISO string
    const localDate = new Date(scheduledAt)
    const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000)

    const updatedPost: Post = {
      ...post,
      content,
      platform,
      imageUrl: imageUrl || undefined,
      scheduledAt: utcDate.toISOString(),
    }

    onSave(updatedPost)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>Make changes to your scheduled post</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your post content..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Platform</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
              >
                {ALL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {imageUrl && (
            <div className="space-y-2">
              <Label>Image Preview</Label>
              <img
                src={imageUrl || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-32 object-cover rounded-md border"
                crossOrigin="anonymous"
              />
            </div>
          )}

          {post && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">Status: {post.status}</Badge>
              <Badge variant="outline">ID: {post.id.slice(0, 8)}</Badge>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!content.trim()}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
