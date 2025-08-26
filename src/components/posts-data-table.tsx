"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Eye, Edit, Trash2, Calendar, Clock } from "lucide-react"
import type { Post } from "@/lib/types"

type Props = {
  posts: Post[]
  onViewPost?: (post: Post) => void
  onEditPost?: (post: Post) => void
  onDeletePost?: (post: Post) => void
}

const ITEMS_PER_PAGE = 10

export default function PostsDataTable({ posts, onViewPost, onEditPost, onDeletePost }: Props) {
  const [currentPage, setCurrentPage] = useState(1)

  // Filter posts for next 7 days
  const next7DaysPosts = useMemo(() => {
    const now = new Date()
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return posts
      .filter((post) => {
        const postDate = new Date(post.scheduledAt)
        return postDate >= now && postDate <= next7Days
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  }, [posts])

  // Pagination
  const totalPages = Math.ceil(next7DaysPosts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPosts = next7DaysPosts.slice(startIndex, endIndex)

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDaysFromNow = (dateString: string) => {
    const now = new Date()
    const postDate = new Date(dateString)
    const diffTime = postDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    return `In ${diffDays} days`
  }

  if (next7DaysPosts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Posts (Next 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Upcoming Posts</h3>
            <p className="text-sm">You don't have any posts scheduled for the next 7 days.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Upcoming Posts (Next 7 Days)</CardTitle>
          <Badge variant="outline">{next7DaysPosts.length} posts</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Platform</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[80px]">Time</TableHead>
                <TableHead className="w-[100px]">Due</TableHead>
                <TableHead>Content</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPosts.map((post) => (
                <TableRow key={post.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Badge className={`${getPlatformColor(post.platform)} border text-xs`}>
                      {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(post.status)} border text-xs`}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {formatDate(post.scheduledAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {formatTime(post.scheduledAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-muted-foreground">
                      {getDaysFromNow(post.scheduledAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <p className="text-sm line-clamp-2 text-muted-foreground">{post.content}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onViewPost?.(post)} className="h-8 w-8 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onEditPost?.(post)} className="h-8 w-8 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeletePost?.(post)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, next7DaysPosts.length)} of {next7DaysPosts.length} posts
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
      </CardContent>
    </Card>
  )
}
