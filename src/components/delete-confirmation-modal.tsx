"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Trash2 } from "lucide-react"
import type { Post } from "@/lib/types"

type Props = {
  post: Post | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export default function DeleteConfirmationModal({ post, open, onOpenChange, onConfirm }: Props) {
  if (!post) return null

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Post
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${getPlatformColor(post.platform)} border`}>
                {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">{new Date(post.scheduledAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm line-clamp-3">{post.content}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
