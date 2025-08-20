"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Trash2, Calendar } from "lucide-react"
import type { Post } from "@/lib/types"

type Props = {
  posts: Post[]
  date: Date | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export default function BulkDeleteModal({ posts, date, open, onOpenChange, onConfirm }: Props) {
  if (!date || posts.length === 0) return null

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
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete All Posts for {date.toLocaleDateString()}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete all {posts.length} post{posts.length !== 1 ? "s" : ""} scheduled for this
            date? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getPlatformColor(post.platform)} border text-xs`}>
                  {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.scheduledAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <p className="text-sm line-clamp-2">{post.content}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Delete All {posts.length} Posts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
