"use client"
import { useRouter } from "next/navigation"
import { Filter, Plus, CalendarIcon, Eye } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useEffect, useMemo, useState } from "react"
import TopBar from "@/components/top-bar"
import CalendarView from "@/components/calendar-view"
import ScheduleModal from "@/components/schedule-modal"
import PostViewModal from "@/components/post-view-modal"
import EditPostModal from "@/components/edit-post-modal"
import DeleteConfirmationModal from "@/components/delete-confirmation-modal"
import BulkDeleteModal from "@/components/bulk-delete-modal"
import { ToastProvider, useToast } from "@/components/toast-notification"
import { LoadingOverlay } from "@/components/loading-spinner"
import { getSessionUser, updatePost, deletePost, deletePosts } from "@/lib/storage"
import type { Platform, Post } from "@/lib/types"

function DashboardContent() {
  const router = useRouter()
  const { showToast } = useToast()
  const [openCreate, setOpenCreate] = useState(false)
  const [openViewPosts, setOpenViewPosts] = useState(false)
  const [openEditPost, setOpenEditPost] = useState(false)
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false)
  const [openBulkDelete, setOpenBulkDelete] = useState(false)
  const [selectedPosts, setSelectedPosts] = useState<Post[]>([])
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deletingPost, setDeletingPost] = useState<Post | null>(null)
  const [bulkDeletePosts, setBulkDeletePosts] = useState<Post[]>([])
  const [bulkDeleteDate, setBulkDeleteDate] = useState<Date | null>(null)
  const [viewTitle, setViewTitle] = useState("")
  const [platformFilter, setPlatformFilter] = useState<Platform[] | null>(null)
  const [statusFilter, setStatusFilter] = useState<("scheduled" | "posted" | "failed")[] | null>(null)
  const [loading, setLoading] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    const user = getSessionUser()
    if (!user) {
      router.push("/login")
    }
  }, [router])

  const [posts, setPosts] = useState<Post[]>([])

  // Load posts for session user
  const loadPosts = () => {
    const user = getSessionUser()
    if (!user) return
    const raw = localStorage.getItem(`smp:posts:${user.id}`)
    if (raw) {
      try {
        setPosts(JSON.parse(raw))
      } catch {
        setPosts([])
      }
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  // Refresh posts when modals close
  useEffect(() => {
    if (!openCreate) {
      loadPosts()
    }
  }, [openCreate])

  // filtered posts
  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const pf = !platformFilter || platformFilter.length === 0 || platformFilter.includes(p.platform)
      const sf = !statusFilter || statusFilter.length === 0 || statusFilter.includes(p.status)
      return pf && sf
    })
  }, [posts, platformFilter, statusFilter])

  const ongoingCount = filtered.filter((p) => p.status === "scheduled").length

  const handleDateClick = (date: Date, datePosts: Post[]) => {
    setSelectedPosts(datePosts)
    setViewTitle(`Posts for ${date.toLocaleDateString()}`)
    setOpenViewPosts(true)
  }

  const handleViewPost = (post: Post) => {
    setSelectedPosts([post])
    setViewTitle(`Post Details`)
    setOpenViewPosts(true)
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setOpenViewPosts(false)
    setOpenEditPost(true)
  }

  const handleSavePost = async (updatedPost: Post) => {
    const user = getSessionUser()
    if (!user) return

    setLoading(true)

    // Simulate async operation
    setTimeout(() => {
      updatePost(user.id, updatedPost)
      loadPosts()
      setEditingPost(null)
      setLoading(false)

      showToast({
        type: "success",
        title: "Post Updated",
        message: "Your post has been successfully updated.",
      })
    }, 500)
  }

  const handleDeletePost = (post: Post) => {
    setDeletingPost(post)
    setOpenViewPosts(false)
    setOpenDeleteConfirm(true)
  }

  const handleBulkDelete = (posts: Post[], date: Date) => {
    setBulkDeletePosts(posts)
    setBulkDeleteDate(date)
    setOpenViewPosts(false)
    setOpenBulkDelete(true)
  }

  const handleConfirmDelete = async () => {
    const user = getSessionUser()
    if (!user || !deletingPost) return

    setLoading(true)

    // Simulate async operation
    setTimeout(() => {
      deletePost(user.id, deletingPost.id)
      loadPosts()
      setDeletingPost(null)
      setOpenDeleteConfirm(false)
      setLoading(false)

      showToast({
        type: "success",
        title: "Post Deleted",
        message: "The post has been successfully deleted.",
      })
    }, 500)
  }

  const handleConfirmBulkDelete = async () => {
    const user = getSessionUser()
    if (!user || bulkDeletePosts.length === 0) return

    setLoading(true)

    // Simulate async operation
    setTimeout(() => {
      const postIds = bulkDeletePosts.map((p) => p.id)
      deletePosts(user.id, postIds)
      loadPosts()
      setBulkDeletePosts([])
      setBulkDeleteDate(null)
      setOpenBulkDelete(false)
      setLoading(false)

      showToast({
        type: "success",
        title: "Posts Deleted",
        message: `Successfully deleted ${postIds.length} posts.`,
      })
    }, 800)
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "facebook":
        return "bg-blue-100 text-blue-800"
      case "instagram":
        return "bg-pink-100 text-pink-800"
      case "linkedin":
        return "bg-blue-100 text-blue-900"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-yellow-100 text-yellow-800"
      case "posted":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <LoadingOverlay loading={loading}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex w-full flex-col">
            <div className="flex items-center gap-2 border-b bg-background px-4 py-2">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <span className="font-medium">Scheduler</span>
              </div>
            </div>

            <TopBar
              onCreate={() => setOpenCreate(true)}
              platformFilter={platformFilter ?? []}
              onPlatformFilterChange={setPlatformFilter}
              statusFilter={statusFilter ?? []}
              onStatusFilterChange={setStatusFilter}
            />

            <main className="container mx-auto p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ongoing schedules</span>
                      <Badge variant="secondary">{ongoingCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total posts</span>
                      <Badge variant="outline">{filtered.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Platforms</span>
                      <div className="flex gap-1">
                        <Badge variant="outline">FB</Badge>
                        <Badge variant="outline">IG</Badge>
                        <Badge variant="outline">IN</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Quick Actions</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => setOpenCreate(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Schedule
                      </Button>
                      <Button variant="ghost">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="calendar">
                      <TabsList>
                        <TabsTrigger value="calendar">Calendar</TabsTrigger>
                        <TabsTrigger value="list">List</TabsTrigger>
                      </TabsList>
                      <TabsContent value="calendar" className="pt-4">
                        <CalendarView posts={filtered} onDateClick={handleDateClick} />
                      </TabsContent>
                      <TabsContent value="list" className="pt-4">
                        <div className="space-y-3">
                          {filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No posts match the current filters.</p>
                          ) : (
                            filtered
                              .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
                              .map((p) => (
                                <Card key={p.id} className="hover:shadow-md transition-shadow">
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                      {/* Image thumbnail */}
                                      {p.imageUrl && (
                                        <div className="flex-shrink-0">
                                          <img
                                            src={p.imageUrl || "/placeholder.svg"}
                                            alt="Post preview"
                                            className="w-16 h-16 rounded-md object-cover"
                                            crossOrigin="anonymous"
                                          />
                                        </div>
                                      )}

                                      {/* Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge className={getPlatformColor(p.platform)}>
                                            {p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}
                                          </Badge>
                                          <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                                          <span className="text-sm text-muted-foreground">
                                            {new Date(p.scheduledAt).toLocaleString()}
                                          </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.content}</p>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleViewPost(p)}
                                          className="flex items-center gap-2"
                                        >
                                          <Eye className="h-4 w-4" />
                                          View Post
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </SidebarInset>

        <ScheduleModal open={openCreate} onOpenChange={setOpenCreate} />
        <PostViewModal
          posts={selectedPosts}
          open={openViewPosts}
          onOpenChange={setOpenViewPosts}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
          onBulkDelete={handleBulkDelete}
          title={viewTitle}
        />
        {editingPost && (
          <EditPostModal
            post={editingPost}
            open={openEditPost}
            onOpenChange={setOpenEditPost}
            onSave={handleSavePost}
          />
        )}
        <DeleteConfirmationModal
          post={deletingPost}
          open={openDeleteConfirm}
          onOpenChange={setOpenDeleteConfirm}
          onConfirm={handleConfirmDelete}
        />
        <BulkDeleteModal
          posts={bulkDeletePosts}
          date={bulkDeleteDate}
          open={openBulkDelete}
          onOpenChange={setOpenBulkDelete}
          onConfirm={handleConfirmBulkDelete}
        />
      </SidebarProvider>
    </LoadingOverlay>
  )
}

export default function DashboardPage() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  )
}
