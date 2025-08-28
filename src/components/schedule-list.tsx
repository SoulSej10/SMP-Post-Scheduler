"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Eye, Edit, Trash2, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Post, Platform } from "@/lib/types"

type Props = {
  posts: Post[]
  platform: Platform
  onViewPost?: (post: Post) => void
  onEditPost?: (post: Post) => void
  onDeletePost?: (post: Post) => void
}

type PostStatus = "all" | "previous" | "ongoing" | "upcoming"

const POSTS_PER_PAGE = 3

export default function ScheduleList({ posts, platform, onViewPost, onEditPost, onDeletePost }: Props) {
  const [statusFilter, setStatusFilter] = React.useState<PostStatus>("all")
  const [currentMonth, setCurrentMonth] = React.useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = React.useState(new Date().getFullYear())
  const [currentPage, setCurrentPage] = React.useState(1)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

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

  const categorizePost = (post: Post): PostStatus => {
    const now = new Date()
    const postDate = new Date(post.scheduledAt)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const postDay = new Date(postDate.getFullYear(), postDate.getMonth(), postDate.getDate())

    if (postDay < today) {
      return "previous"
    } else if (postDay.getTime() === today.getTime()) {
      return "ongoing"
    } else {
      return "upcoming"
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
    setCurrentPage(1) // Reset to first page when changing months
  }

  // Filter posts by status, month, and platform
  const filteredPosts = React.useMemo(() => {
    return posts
      .filter((post) => {
        const postDate = new Date(post.scheduledAt)
        const monthMatch = postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear
        const statusMatch = statusFilter === "all" || categorizePost(post) === statusFilter
        return monthMatch && statusMatch
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  }, [posts, statusFilter, currentMonth, currentYear])

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE
  const endIndex = startIndex + POSTS_PER_PAGE
  const currentPosts = filteredPosts.slice(startIndex, endIndex)

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, currentMonth, currentYear])

  const getStatusLabel = (status: PostStatus) => {
    switch (status) {
      case "all":
        return "All Posts"
      case "previous":
        return "Previous"
      case "ongoing":
        return "Today"
      case "upcoming":
        return "Upcoming"
    }
  }

  const getStatusCount = (status: PostStatus) => {
    if (status === "all") {
      return posts.filter((post) => {
        const postDate = new Date(post.scheduledAt)
        return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear
      }).length
    }

    return posts.filter((post) => {
      const postDate = new Date(post.scheduledAt)
      const monthMatch = postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear
      return monthMatch && categorizePost(post) === status
    }).length
  }

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
    <div className="space-y-4">
      {/* Header with Status Filter and Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value: PostStatus) => setStatusFilter(value)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center justify-between w-full">
                  <span>All Posts</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {getStatusCount("all")}
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="previous">
                <div className="flex items-center justify-between w-full">
                  <span>Previous</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {getStatusCount("previous")}
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="ongoing">
                <div className="flex items-center justify-between w-full">
                  <span>Today</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {getStatusCount("ongoing")}
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="upcoming">
                <div className="flex items-center justify-between w-full">
                  <span>Upcoming</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {getStatusCount("upcoming")}
                  </Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="h-8">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Prev</span>
          </Button>
          <div className="flex items-center gap-1 text-sm font-medium min-w-[120px] justify-center">
            <Calendar className="h-4 w-4" />
            {monthNames[currentMonth]} {currentYear}
            <Badge variant="outline" className="ml-2 text-xs">
              {
                posts.filter((post) => {
                  const postDate = new Date(post.scheduledAt)
                  return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear
                }).length
              }{" "}
              posts
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} className="h-8">
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Posts List */}
      {currentPosts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No {getStatusLabel(statusFilter)} Posts</h3>
              <p className="text-sm">
                No {statusFilter === "all" ? "" : statusFilter} posts found for {monthNames[currentMonth]} {currentYear}
                .
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {currentPosts.map((post) => (
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
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredPosts.length)} of {filteredPosts.length} posts
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
