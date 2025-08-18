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
import { getSessionUser } from "@/lib/storage"
import type { Platform, Post } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const [openCreate, setOpenCreate] = useState(false)
  const [openViewPosts, setOpenViewPosts] = useState(false)
  const [selectedPosts, setSelectedPosts] = useState<Post[]>([])
  const [viewTitle, setViewTitle] = useState("")
  const [platformFilter, setPlatformFilter] = useState<Platform[] | null>(null)
  const [statusFilter, setStatusFilter] = useState<("scheduled" | "posted" | "failed")[] | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    const user = getSessionUser()
    if (!user) {
      router.push("/login")
    }
  }, [router])

  const [posts, setPosts] = useState<Post[]>([])

  // Load posts for session user
  useEffect(() => {
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
  }, [])

  // Refresh posts when modal closes (to reflect any changes)
  useEffect(() => {
    if (!openCreate) {
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
      <PostViewModal posts={selectedPosts} open={openViewPosts} onOpenChange={setOpenViewPosts} title={viewTitle} />
    </SidebarProvider>
  )
}
