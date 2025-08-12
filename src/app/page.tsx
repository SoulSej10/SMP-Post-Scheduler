"use client"
import { useRouter } from "next/navigation"
import { Filter, Plus, CalendarIcon } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../components/ui/sidebar"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { useEffect, useMemo, useState } from "react"
import TopBar from "@/components/top-bar"
import CalendarView from "@/components/calendar-view"
import ScheduleModal from "@/components/schedule-modal"
import { getSessionUser } from "@/lib/storage"
import type { Platform, Post } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const [openCreate, setOpenCreate] = useState(false)
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

  // filtering posts
  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const pf = !platformFilter || platformFilter.length === 0 || platformFilter.includes(p.platform)
      const sf = !statusFilter || statusFilter.length === 0 || statusFilter.includes(p.status)
      return pf && sf
    })
  }, [posts, platformFilter, statusFilter])

  const ongoingCount = filtered.filter((p) => p.status === "scheduled").length

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
                      <CalendarView posts={filtered} />
                    </TabsContent>
                    <TabsContent value="list" className="pt-4">
                      <div className="space-y-2">
                        {filtered.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No posts match the current filters.</p>
                        ) : (
                          filtered
                            .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
                            .map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between rounded-md border p-3 text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="uppercase">
                                    {p.platform.slice(0, 2)}
                                  </Badge>
                                  <span className="font-medium">{new Date(p.scheduledAt).toLocaleString()}</span>
                                </div>
                                <span className="line-clamp-1 text-muted-foreground">{p.content}</span>
                                <Badge variant={p.status === "scheduled" ? "secondary" : "outline"}>{p.status}</Badge>
                              </div>
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
    </SidebarProvider>
  )
}
