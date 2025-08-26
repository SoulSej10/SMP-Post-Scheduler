"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Eye, Edit, Trash2, ImageIcon } from "lucide-react"
import type { Post, Platform } from "@/lib/types"

type Props = {
  posts: Post[]
  platform: Platform
  onViewPost?: (post: Post) => void
  onEditPost?: (post: Post) => void
  onDeletePost?: (post: Post) => void
}

export default function ScheduleList({ posts, platform, onViewPost, onEditPost, onDeletePost }: Props) {
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

  // Sort posts by scheduled date
  const sortedPosts = [...posts].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  // Group posts by month
  const postsByMonth = React.useMemo(() => {
    const groups: Record<string, Post[]> = {}
    sortedPosts.forEach((post) => {
      const date = new Date(post.scheduledAt)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      const monthName = date.toLocaleString("default", { month: "long", year: "numeric" })

      if (!groups[monthKey]) {
        groups[monthKey] = []
      }
      groups[monthKey].push(post)
    })
    return groups
  }, [sortedPosts])

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              No {platform.charAt(0).toUpperCase() + platform.slice(1)} Posts
            </h3>
            <p className="text-sm">You haven't scheduled any posts for this platform yet.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(postsByMonth).map(([monthKey, monthPosts]) => {
        const firstPost = monthPosts[0]
        const monthName = new Date(firstPost.scheduledAt).toLocaleString("default", {
          month: "long",
          year: "numeric",
        })

        return (
          <div key={monthKey}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {monthName}
              <Badge variant="outline">{monthPosts.length} posts</Badge>
            </h3>

            <div className="space-y-3">
              {monthPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Image thumbnail */}
                      {post.imageUrl && (
                        <div className="flex-shrink-0">
                          <div className="relative group">
                            <img
                              src={post.imageUrl || "/placeholder.svg"}
                              alt="Post preview"
                              className="w-16 h-16 rounded-md object-cover"
                              crossOrigin="anonymous"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${getPlatformColor(post.platform)} border text-xs`}>
                            {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                          </Badge>
                          <Badge className={`${getStatusColor(post.status)} border text-xs`}>
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.scheduledAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(post.scheduledAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.content}</p>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewPost?.(post)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditPost?.(post)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDeletePost?.(post)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
