"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Calendar, ImageIcon, Facebook, Instagram, Linkedin } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Post, Platform } from "@/lib/types"

type Props = {
  posts: Post[]
  onUpdatePost?: (
    postId: string,
    updates: Partial<Post & { feedback?: string; boosted?: boolean; approvalStatus?: string }>,
  ) => void
}

type PostWithExtras = Post & {
  feedback?: string
  boosted?: boolean
  approvalStatus?: string
}

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

export default function MonthlyPostsTable({ posts, onUpdatePost }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)

  const availablePlatforms = useMemo(() => {
    const platforms = new Set<Platform>()
    posts.forEach((post) => {
      const postDate = new Date(post.scheduledAt)
      if (postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear) {
        platforms.add(post.platform)
      }
    })
    return Array.from(platforms).sort()
  }, [posts, currentMonth, currentYear])

  useEffect(() => {
    if (availablePlatforms.length > 0 && selectedPlatform === null) {
      setSelectedPlatform(availablePlatforms[0])
    }
  }, [availablePlatforms, selectedPlatform])

  // Filter posts for the current month
  const monthlyPosts = useMemo(() => {
    return posts
      .filter((post) => {
        const postDate = new Date(post.scheduledAt)
        const monthMatch = postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear
        const platformMatch = !selectedPlatform || post.platform === selectedPlatform
        return monthMatch && platformMatch
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  }, [posts, currentMonth, currentYear, selectedPlatform])

  // Group posts by date
  const postsByDate = useMemo(() => {
    const grouped: Record<string, PostWithExtras[]> = {}
    monthlyPosts.forEach((post) => {
      const dateKey = new Date(post.scheduledAt).toLocaleDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push({
        ...post,
        feedback: (post as any).feedback || "",
        boosted: (post as any).boosted || false,
        approvalStatus: (post as any).approvalStatus || "pending-approval",
      })
    })
    return grouped
  }, [monthlyPosts])

  const dateKeys = Object.keys(postsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

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
  }

  const handleUpdateField = (postId: string, field: string, value: any) => {
    if (onUpdatePost) {
      onUpdatePost(postId, { [field]: value })
    }
  }

  const getPlatformConfig = (platform: Platform) => {
    return PLATFORM_CONFIG[platform]
  }

  const getApprovalStatusColor = (status: string) => {
    const option = APPROVAL_STATUS_OPTIONS.find((opt) => opt.value === status)
    return option?.color || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getOptimizedImageUrl = (imageUrl: string, platform: Platform) => {
    if (!imageUrl || imageUrl.includes("placeholder.svg")) {
      const config = getPlatformConfig(platform)
      return `/placeholder.svg?height=${config.imageSize.height}&width=${config.imageSize.width}&query=${encodeURIComponent(`${config.name} optimized post`)}`
    }
    return imageUrl
  }

  const getFullSizeImageUrl = (imageUrl: string, platform: Platform) => {
    if (!imageUrl || imageUrl.includes("placeholder.svg")) {
      const config = getPlatformConfig(platform)
      return `/placeholder.svg?height=${config.fullSize.height}&width=${config.fullSize.width}&query=${encodeURIComponent(`${config.name} full size post`)}`
    }
    return imageUrl
  }

  const formatPostContent = (content: string): string => {
    // Convert markdown-style formatting to HTML for proper display
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **bold**
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // *italic*
      .replace(/__(.*?)__/g, "<u>$1</u>") // __underline__
      .replace(/~~(.*?)~~/g, "<del>$1</del>") // ~~strikethrough~~
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>') // `code`
      .replace(
        /https?:\/\/[^\s]+/g,
        '<a href="$&" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$&</a>',
      ) // URLs
      .replace(/\n/g, "<br>") // Line breaks
  }

  if (availablePlatforms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Monthly Posts Overview</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Posts This Month</h3>
            <p className="text-sm">
              No posts scheduled for {monthNames[currentMonth]} {currentYear}.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Monthly Posts Overview</CardTitle>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            {/* Platform Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {availablePlatforms.map((platform) => {
                const config = getPlatformConfig(platform)
                const Icon = config.icon
                return (
                  <Button
                    key={platform}
                    variant={selectedPlatform === platform ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPlatform(platform)}
                    className="h-8 w-8 sm:w-auto flex items-center justify-center sm:gap-2 p-0 sm:px-3"
                  >
                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${selectedPlatform === platform ? "" : config.color}`} />
                    <span className="hidden sm:inline">{config.name}</span>
                  </Button>
                )
              })}
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="h-8 w-8 p-0 sm:w-auto sm:px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Prev</span>
              </Button>
              <span className="text-xs sm:text-sm font-medium min-w-[100px] sm:min-w-[120px] text-center px-2">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="h-8 w-8 p-0 sm:w-auto sm:px-3"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
            <div>
              <div
                className="grid gap-4 lg:gap-6"
                style={{ gridTemplateColumns: `repeat(${dateKeys.length}, minmax(280px, 350px))` }}
              >
                {dateKeys.map((dateKey) => (
                  <div key={dateKey} className="space-y-4">
                    {postsByDate[dateKey].map((post) => {
                      const config = getPlatformConfig(post.platform)
                      const optimizedImageUrl = getOptimizedImageUrl(post.imageUrl || "", post.platform)
                      const fullImageUrl = getFullSizeImageUrl(post.imageUrl || "", post.platform)
                      return (
                        <div key={post.id} className="space-y-2">
                          <div className="text-xs text-muted-foreground text-center">
                            {config.imageSize.width}×{config.imageSize.height}
                          </div>
                          {optimizedImageUrl ? (
                            <div className="relative group overflow-hidden rounded-lg border shadow-sm">
                              <img
                                src={optimizedImageUrl || "/placeholder.svg"}
                                alt={`Post image`}
                                className="w-full aspect-[2/1] object-cover transition-all duration-300 group-hover:scale-110 group-hover:aspect-square"
                                crossOrigin="anonymous"
                              />
                              {/* Hover overlay with full image */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white rounded-lg border-2 border-primary shadow-lg z-10 overflow-hidden">
                                <img
                                  src={fullImageUrl || "/placeholder.svg"}
                                  alt={`Full post image`}
                                  className="w-full h-full object-cover"
                                  crossOrigin="anonymous"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full aspect-[2/1] bg-gray-100 rounded-lg border flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Content Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-4 mb-0">Content</h3>
              <div
                className="grid gap-4 lg:gap-6"
                style={{ gridTemplateColumns: `repeat(${dateKeys.length}, minmax(280px, 350px))` }}
              >
                {dateKeys.map((dateKey) => (
                  <div key={dateKey} className="space-y-4">
                    {postsByDate[dateKey].map((post) => {
                      return (
                        <div key={post.id} className="bg-background border rounded-lg p-4 shadow-sm">
                          <div
                            className="text-sm leading-relaxed max-h-48 overflow-y-auto prose prose-sm max-w-none"
                            style={{
                              scrollbarWidth: "thin",
                              scrollbarColor: "#cbd5e1 #f1f5f9",
                            }}
                            dangerouslySetInnerHTML={{
                              __html: formatPostContent(post.content),
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-4 mb-0">
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
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-4 mb-0">
                Approval Status
              </h3>
              <div
                className="grid gap-4 lg:gap-6"
                style={{ gridTemplateColumns: `repeat(${dateKeys.length}, minmax(280px, 350px))` }}
              >
                {dateKeys.map((dateKey) => (
                  <div key={dateKey} className="space-y-4">
                    {postsByDate[dateKey].map((post) => (
                      <div className="mb-4" key={post.id}>
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

        {/* Custom scrollbar styles */}
        <style jsx>{`
          .prose::-webkit-scrollbar {
            width: 6px;
          }
          .prose::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }
          .prose::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          .prose::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>
      </CardContent>
    </Card>
  )
}
