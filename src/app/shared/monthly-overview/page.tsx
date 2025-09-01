"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Facebook, Instagram, Linkedin, ExternalLink } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { Post, Platform } from "@/lib/types"

const APPROVAL_STATUS_OPTIONS = [
  { value: "pending-approval", label: "Pending Approval", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800 border-green-200" },
  {
    value: "approved-with-corrections",
    label: "Approved with Corrections",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  { value: "not-approved", label: "Not Approved", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "pre-approved", label: "Pre-approved", color: "bg-purple-100 text-purple-800 border-purple-200" },
]

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

const PLATFORM_CONFIG = {
  facebook: {
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    bgColor: "bg-blue-100 text-blue-800 border-blue-200",
    imageSize: { width: 1200, height: 600 },
    fullSize: { width: 1024, height: 1024 },
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-600",
    bgColor: "bg-pink-100 text-pink-800 border-pink-200",
    imageSize: { width: 1200, height: 600 },
    fullSize: { width: 1024, height: 1024 },
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-700",
    bgColor: "bg-blue-100 text-blue-900 border-blue-300",
    imageSize: { width: 1200, height: 600 },
    fullSize: { width: 1024, height: 1024 },
  },
}

function SharedMonthlyOverview() {
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const month = Number.parseInt(searchParams.get("month") || "0")
  const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString())
  const platform = (searchParams.get("platform") as Platform) || "facebook"

  useEffect(() => {
    // In a real implementation, this would fetch shared posts from an API
    // For now, we'll simulate with sample data
    const samplePosts: Post[] = [
      {
        id: "1",
        userId: "user1",
        companyId: "company1",
        platform: "facebook",
        content:
          "🚀 Exciting news! We're launching our new product next week. Stay tuned for more updates! #innovation #launch",
        imageUrl: "/product-launch.png",
        scheduledAt: new Date(year, month, 5, 10, 0).toISOString(),
        status: "scheduled",
        feedback: "",
        approvalStatus: "pending-approval",
      },
      {
        id: "2",
        userId: "user1",
        companyId: "company1",
        platform: "instagram",
        content:
          "Behind the scenes at our office! 📸 Our team working hard to bring you the best experience. #teamwork #office",
        imageUrl: "/office-team-collaboration.png",
        scheduledAt: new Date(year, month, 10, 14, 30).toISOString(),
        status: "scheduled",
        feedback: "",
        approvalStatus: "pending-approval",
      },
    ]

    setPosts(samplePosts)
    setLoading(false)
  }, [month, year, platform])

  const handleUpdateField = (postId: string, field: string, value: any) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, [field]: value } : post)))

    // In a real implementation, this would sync changes back to the main application
    console.log(`Updated post ${postId}: ${field} = ${value}`)
  }

  const formatPostContent = (content: string): string => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/__(.*?)__/g, "<u>$1</u>")
      .replace(/~~(.*?)~~/g, "<del>$1</del>")
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>')
      .replace(
        /https?:\/\/[^\s]+/g,
        '<a href="$&" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$&</a>',
      )
      .replace(/\n/g, "<br>")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Loading monthly overview...</p>
        </div>
      </div>
    )
  }

  const filteredPosts = posts.filter((post) => {
    const postDate = new Date(post.scheduledAt)
    const monthMatch = postDate.getMonth() === month && postDate.getFullYear() === year
    const platformMatch = post.platform === platform
    return monthMatch && platformMatch
    })

  const postsByDate = filteredPosts.reduce(
    (acc, post) => {
      const dateKey = new Date(post.scheduledAt).toLocaleDateString()
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(post)
      return acc
    },
    {} as Record<string, Post[]>,
  )

  const dateKeys = Object.keys(postsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Monthly Posts Overview</h1>
              <p className="text-muted-foreground">
                {monthNames[month]} {year} - Shared for Review
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-2">
              <ExternalLink className="h-3 w-3" />
              Shared View
            </Badge>
          </div>
        </div>

        {dateKeys.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Posts This Month</h3>
              <p className="text-sm text-muted-foreground">
                No posts scheduled for {monthNames[month]} {year}.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <div className="min-w-max lg:min-w-0">
                  {/* Date Headers */}
                  <div
                    className="grid gap-4 mb-6 lg:gap-6"
                    style={{ gridTemplateColumns: `repeat(${dateKeys.length}, minmax(280px, 350px))` }}
                  >
                    {dateKeys.map((dateKey) => (
                      <div key={dateKey} className="text-center">
                        <div className="font-semibold text-lg mb-2">
                          {new Date(dateKey).toLocaleDateString(undefined, {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="h-px bg-border"></div>
                      </div>
                    ))}
                  </div>

                  {/* Images Section */}
                  <div className="mb-6">
                    <div
                      className="grid gap-4 lg:gap-6"
                      style={{ gridTemplateColumns: `repeat(${dateKeys.length}, minmax(280px, 350px))` }}
                    >
                      {dateKeys.map((dateKey) => (
                        <div key={dateKey} className="space-y-4">
                          {postsByDate[dateKey].map((post) => {
                            const config = PLATFORM_CONFIG[post.platform]
                            return (
                              <div key={post.id} className="space-y-2">
                                <div className="text-xs text-muted-foreground text-center">
                                  {config.imageSize.width}×{config.imageSize.height}
                                </div>
                                <div className="relative overflow-hidden rounded-lg border shadow-sm">
                                  <img
                                    src={post.imageUrl || "/placeholder.svg"}
                                    alt="Post image"
                                    className="w-full aspect-[2/1] object-cover"
                                    crossOrigin="anonymous"
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                      Content
                    </h3>
                    <div
                      className="grid gap-4 lg:gap-6"
                      style={{ gridTemplateColumns: `repeat(${dateKeys.length}, minmax(280px, 350px))` }}
                    >
                      {dateKeys.map((dateKey) => (
                        <div key={dateKey} className="space-y-4">
                          {postsByDate[dateKey].map((post) => (
                            <div key={post.id} className="bg-background border rounded-lg p-4 shadow-sm">
                              <div
                                className="text-sm leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                  __html: formatPostContent(post.content),
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Section */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                      Feedback & Notes
                    </h3>
                    <div
                      className="grid gap-4 lg:gap-6"
                      style={{ gridTemplateColumns: `repeat(${dateKeys.length}, minmax(280px, 350px))` }}
                    >
                      {dateKeys.map((dateKey) => (
                        <div key={dateKey} className="space-y-4">
                          {postsByDate[dateKey].map((post) => (
                            <div key={post.id}>
                              <Textarea
                                placeholder="Add feedback or notes..."
                                value={(post as any).feedback || ""}
                                onChange={(e) => handleUpdateField(post.id, "feedback", e.target.value)}
                                className="min-h-[80px] text-sm resize-none border-dashed"
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Approval Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                      Approval Status
                    </h3>
                    <div
                      className="grid gap-4 lg:gap-6"
                      style={{ gridTemplateColumns: `repeat(${dateKeys.length}, minmax(280px, 350px))` }}
                    >
                      {dateKeys.map((dateKey) => (
                        <div key={dateKey} className="space-y-4">
                          {postsByDate[dateKey].map((post) => (
                            <div key={post.id}>
                              <Select
                                value={(post as any).approvalStatus || "pending-approval"}
                                onValueChange={(value) => handleUpdateField(post.id, "approvalStatus", value)}
                              >
                                <SelectTrigger className="h-10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {APPROVAL_STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${option.color.split(" ")[0]}`} />
                                        {option.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function SharedMonthlyOverviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SharedMonthlyOverview />
    </Suspense>
  )
}
