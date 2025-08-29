"use client"
import { Suspense } from "react"
import type React from "react"
import MobileCalendarFilter from "@/components/mobile-calendar-filter"

import { useRouter, useSearchParams } from "next/navigation"
import { Filter, Plus } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useMemo, useState } from "react"
import MiniCalendar from "@/components/mini-calendar"
import ScheduleList from "@/components/schedule-list"
import ScheduleModal from "@/components/schedule-modal"
import PostViewModal from "@/components/post-view-modal"
import EditPostModal from "@/components/edit-post-modal"
import DeleteConfirmationModal from "@/components/delete-confirmation-modal"
import BulkDeleteModal from "@/components/bulk-delete-modal"
import MonthlyPostsTable from "@/components/monthly-posts-table"
import { ToastProvider, useToast } from "@/components/toast-notification"
import { LoadingOverlay } from "@/components/loading-spinner"
import { getSessionUser, updatePost, deletePost, deletePosts } from "@/lib/storage"
import type { Platform, Post } from "@/lib/types"
import PostsDataTable from "@/components/posts-data-table"

function SearchParamsProvider({ children }: { children: (platformFilter: Platform | null) => React.ReactNode }) {
  const searchParams = useSearchParams()
  const platformFilter = searchParams.get("platform") as Platform | null
  return <>{children(platformFilter)}</>
}

type DashboardContentProps = {
  platformFilter: Platform | null
}

function DashboardContent({ platformFilter }: DashboardContentProps) {
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
  const [loading, setLoading] = useState(false)

  const isDashboardView = !platformFilter

  useEffect(() => {
    const user = getSessionUser()
    if (!user) {
      router.push("/login")
      return
    }

    // Check if user needs to complete onboarding
    if (!user.onboardingCompleted) {
      router.push("/onboarding")
      return
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

  // filtered posts based on platform from sidebar
  const filtered = useMemo(() => {
    return posts.filter((p) => {
      return !platformFilter || p.platform === platformFilter
    })
  }, [posts, platformFilter])

  const ongoingCount = filtered.filter((p) => p.status === "scheduled").length

  // Generate months for dashboard view (all months)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  const allOrderedMonths = useMemo(() => {
    const months = []

    // Current month first
    months.push({
      month: currentMonth,
      year: currentYear,
      name: new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" }),
      isInactive: false,
    })

    // Upcoming months
    for (let i = currentMonth + 1; i < 12; i++) {
      months.push({
        month: i,
        year: currentYear,
        name: new Date(currentYear, i).toLocaleString("default", { month: "long" }),
        isInactive: false,
      })
    }

    // Previous months (at the bottom)
    for (let i = 0; i < currentMonth; i++) {
      months.push({
        month: i,
        year: currentYear,
        name: new Date(currentYear, i).toLocaleString("default", { month: "long" }),
        isInactive: true,
      })
    }

    return months
  }, [currentMonth, currentYear])

  // Generate months for platform filtering view (only relevant months)
  const platformRelevantMonths = useMemo(() => {
    if (!platformFilter) return []

    const relevantMonths = []
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Check if current month has posts for this platform
    const currentMonthPosts = filtered.filter((p) => {
      const postDate = new Date(p.scheduledAt)
      return postDate >= currentMonthStart && postDate < nextMonthStart
    })

    if (currentMonthPosts.length > 0) {
      relevantMonths.push({
        month: currentMonth,
        year: currentYear,
        name: new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" }),
        isInactive: false,
      })
    }

    // Check if next month has posts for this platform (if we're not in December)
    if (currentMonth < 11) {
      const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 1)
      const nextMonthPosts = filtered.filter((p) => {
        const postDate = new Date(p.scheduledAt)
        return postDate >= nextMonthStart && postDate < nextMonthEnd
      })

      if (nextMonthPosts.length > 0) {
        relevantMonths.push({
          month: currentMonth + 1,
          year: currentYear,
          name: new Date(currentYear, currentMonth + 1).toLocaleString("default", { month: "long" }),
          isInactive: false,
        })
      }
    }

    // If no posts in current or next month, show current month anyway
    if (relevantMonths.length === 0) {
      relevantMonths.push({
        month: currentMonth,
        year: currentYear,
        name: new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" }),
        isInactive: false,
      })
    }

    return relevantMonths
  }, [platformFilter, filtered, currentMonth, currentYear])

  const handleDateClick = (date: Date, datePosts: Post[]) => {
    if (datePosts.length > 0) {
      setSelectedPosts(datePosts)
      setViewTitle(`Posts for ${date.toLocaleDateString()}`)
      setOpenViewPosts(true)
    }
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

  const handleUpdateMonthlyPost = (postId: string, updates: any) => {
    const user = getSessionUser()
    if (!user) return

    // Find the post and update it with the new fields
    const post = posts.find((p) => p.id === postId)
    if (post) {
      const updatedPost = { ...post, ...updates }
      updatePost(user.id, updatedPost)
      loadPosts()

      showToast({
        type: "success",
        title: "Post Updated",
        message: "Post details have been updated successfully.",
      })
    }
  }

  const getPlatformName = (platform: Platform | null) => {
    if (!platform) return "All Platforms"
    return platform.charAt(0).toUpperCase() + platform.slice(1)
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
                <span className="font-medium">{isDashboardView ? "Dashboard" : "Schedules"}</span>
                {platformFilter && (
                  <Badge variant="outline" className="ml-2">
                    {getPlatformName(platformFilter)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Top Action Bar */}
            <div className="border-b px-4 py-3">
              {/* Mobile Layout */}
              <div className="flex flex-col gap-3 sm:hidden">
                <div className="flex items-center justify-between">
                  <h1 className="text-lg font-semibold">
                    {platformFilter ? `${getPlatformName(platformFilter)} Schedules` : "Dashboard Overview"}
                  </h1>
                  <Button
                    size="sm"
                    onClick={() => setOpenCreate(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>
                      Ongoing: <Badge variant="secondary">{ongoingCount}</Badge>
                    </span>
                    <span>
                      Total: <Badge variant="outline">{filtered.length}</Badge>
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-lg font-semibold">
                    {platformFilter ? `${getPlatformName(platformFilter)} Schedules` : "Dashboard Overview"}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      Ongoing: <Badge variant="secondary">{ongoingCount}</Badge>
                    </span>
                    <span>
                      Total: <Badge variant="outline">{filtered.length}</Badge>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setOpenCreate(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Schedule
                  </Button>
                  <Button variant="ghost">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </div>
            </div>

            <main className="container mx-auto p-6">
              {isDashboardView ? (
                // Dashboard View - Show all months and overview stats
                <>
                  {/* Quick Stats - Dashboard only */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {
                            filtered.filter((p) => {
                              const postDate = new Date(p.scheduledAt)
                              const now = new Date()
                              return (
                                postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear()
                              )
                            }).length
                          }
                        </div>
                        <p className="text-xs text-muted-foreground">scheduled posts</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Next 7 Days</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {
                            filtered.filter((p) => {
                              const postDate = new Date(p.scheduledAt)
                              const now = new Date()
                              const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                              return postDate >= now && postDate <= nextWeek
                            }).length
                          }
                        </div>
                        <p className="text-xs text-muted-foreground">upcoming posts</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {filtered.length > 0
                            ? Math.round((filtered.filter((p) => p.status === "posted").length / filtered.length) * 100)
                            : 0}
                          %
                        </div>
                        <p className="text-xs text-muted-foreground">posts delivered</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Monthly Posts Table - Dashboard only */}
                  <div className="mb-8">
                    <MonthlyPostsTable posts={filtered} onUpdatePost={handleUpdateMonthlyPost} />
                  </div>

                  {/* Calendar Overview - Dashboard only */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">{currentYear} Calendar Overview</h2>
                    </div>

                    {/* Mobile View - Only Active Calendars */}
                    <div className="sm:hidden mb-4">
                      <MobileCalendarFilter
                        posts={filtered}
                        onDateClick={handleDateClick}
                        currentYear={currentYear}
                        currentMonth={currentMonth}
                      />
                    </div>

                    {/* Desktop View - All Calendars */}
                    <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {allOrderedMonths.map(({ month, year, isInactive }) => (
                        <MiniCalendar
                          key={`${year}-${month}`}
                          month={month}
                          year={year}
                          posts={filtered}
                          onDateClick={handleDateClick}
                          className="hover:shadow-md transition-shadow"
                          isInactive={isInactive}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Data Table - Dashboard only */}
                  <PostsDataTable
                    posts={filtered}
                    onViewPost={handleViewPost}
                    onEditPost={handleEditPost}
                    onDeletePost={handleDeletePost}
                  />
                </>
              ) : (
                // Platform Filtering View - Show relevant months and schedule list
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Mini Calendars - Platform filtering only */}
                  <div className="lg:col-span-1">
                    <h2 className="text-lg font-semibold mb-4">{getPlatformName(platformFilter)} Calendar</h2>
                    <div className="space-y-4">
                      {platformRelevantMonths.map(({ month, year, isInactive }) => (
                        <MiniCalendar
                          key={`${year}-${month}`}
                          month={month}
                          year={year}
                          posts={filtered}
                          onDateClick={handleDateClick}
                          className="hover:shadow-md transition-shadow"
                          isInactive={isInactive}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Schedule List - Platform filtering only */}
                  <div className="lg:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Scheduled Posts</h2>
                    <ScheduleList
                      posts={filtered}
                      platform={platformFilter!}
                      onViewPost={handleViewPost}
                      onEditPost={handleEditPost}
                      onDeletePost={handleDeletePost}
                    />
                  </div>
                </div>
              )}
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
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <SearchParamsProvider>
          {(platformFilter) => <DashboardContent platformFilter={platformFilter} />}
        </SearchParamsProvider>
      </Suspense>
    </ToastProvider>
  )
}
