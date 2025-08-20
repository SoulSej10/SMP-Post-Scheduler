"use client"

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, Share2, Eye, Edit, Trash2, ImageIcon, TrashIcon } from "lucide-react"
import { useState } from "react"
import { LoadingSpinner } from "./loading-spinner"
import { useToast } from "./toast-notification"
import ImageViewerModal from "./image-viewer-modal"
import type { Post } from "@/lib/types"

type Props = {
  posts: Post[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (post: Post) => void
  onDelete?: (post: Post) => void
  onBulkDelete?: (posts: Post[], date: Date) => void
  title?: string
}

export default function PostViewModal({ posts, open, onOpenChange, onEdit, onDelete, onBulkDelete, title }: Props) {
  const { showToast } = useToast()
  const [sendingStates, setSendingStates] = useState<Record<string, boolean>>({})
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null)

  const handlePostNow = async (post: Post) => {
    setSendingStates((prev) => ({ ...prev, [post.id]: true }))

    // Mock success for now
    setTimeout(() => {
      setSendingStates((prev) => ({ ...prev, [post.id]: false }))

      showToast({
        type: "success",
        title: "Posted Successfully!",
        message: `Your post has been sent to ${post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}.`,
      })
    }, 1500)
  }

  const handleImageClick = (imageUrl: string, postPlatform: string) => {
    setSelectedImage({
      url: imageUrl,
      title: `${postPlatform.charAt(0).toUpperCase() + postPlatform.slice(1)} Post Image`,
    })
    setImageViewerOpen(true)
  }

  const handleBulkDeleteClick = () => {
    if (posts.length > 0 && onBulkDelete) {
      // Get the date from the first post (assuming all posts are from the same date)
      const date = new Date(posts[0].scheduledAt)
      onBulkDelete(posts, date)
    }
  }

  // Check if all posts are from the same date
  const isSameDate =
    posts.length > 1 &&
    posts.every((post) => {
      const firstDate = new Date(posts[0].scheduledAt).toDateString()
      const currentDate = new Date(post.scheduledAt).toDateString()
      return firstDate === currentDate
    })

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

  const getPlatformAction = (platform: string) => {
    switch (platform) {
      case "facebook":
        return "Post to Facebook"
      case "instagram":
        return "Post to Instagram"
      case "linkedin":
        return "Post to LinkedIn"
      default:
        return "Post Now"
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {title || `Viewing ${posts.length} Post${posts.length !== 1 ? "s" : ""}`}
              </div>
              {isSameDate && onBulkDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete All ({posts.length})
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      {/* Image Section */}
                      {post.imageUrl && (
                        <div className="lg:w-1/3 bg-gray-50 relative group">
                          <div
                            className="w-full h-48 lg:h-full cursor-pointer transition-opacity group-hover:opacity-80"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleImageClick(post.imageUrl!, post.platform)
                            }}
                          >
                            <img
                              src={post.imageUrl || "/placeholder.svg"}
                              alt="Post image"
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                              <div className="bg-white rounded-full p-2">
                                <ImageIcon className="h-5 w-5 text-gray-700" />
                              </div>
                            </div>
                          </div>
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
                            {/* Status messages are now handled by toast notifications */}
                          </div>
                          <div className="flex items-center gap-2">
                            {onEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onEdit(post)}
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onDelete(post)}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handlePostNow(post)}
                              disabled={sendingStates[post.id]}
                              className="flex items-center gap-2"
                            >
                              {sendingStates[post.id] ? (
                                <>
                                  <LoadingSpinner size="sm" className="mr-1" />
                                  Posting...
                                </>
                              ) : (
                                <>
                                  <Share2 className="h-4 w-4" />
                                  {getPlatformAction(post.platform)}
                                </>
                              )}
                            </Button>
                          </div>
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

      {selectedImage && (
        <ImageViewerModal
          imageUrl={selectedImage.url}
          title={selectedImage.title}
          open={imageViewerOpen}
          onOpenChange={setImageViewerOpen}
        />
      )}
    </>
  )
}
