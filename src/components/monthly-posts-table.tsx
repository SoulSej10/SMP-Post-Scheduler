"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ImageIcon,
  Facebook,
  Instagram,
  Linkedin,
  Share2,
  Copy,
  Check,
  Users,
  Eye,
  MessageSquare,
  CheckCircle,
  Edit,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/toast-notification"
import { getSessionUser, getCompanyMembers, createShareLink, createNotification } from "@/lib/storage"
import type { Post, Platform, SharePrivilege, CompanyMember } from "@/lib/types"

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

const PRIVILEGE_OPTIONS = [
  {
    value: "view" as SharePrivilege,
    label: "View Only",
    description: "Can view posts and content",
    icon: Eye,
    color: "text-blue-600",
  },
  {
    value: "feedback" as SharePrivilege,
    label: "Add Feedback",
    description: "Can view and add feedback/notes",
    icon: MessageSquare,
    color: "text-green-600",
  },
  {
    value: "approve" as SharePrivilege,
    label: "Approve Posts",
    description: "Can view, feedback, and change approval status",
    icon: CheckCircle,
    color: "text-purple-600",
  },
  {
    value: "edit" as SharePrivilege,
    label: "Full Access",
    description: "Can view, feedback, approve, and edit content",
    icon: Edit,
    color: "text-orange-600",
  },
]

export default function MonthlyPostsTable({ posts, onUpdatePost }: Props) {
  const { showToast } = useToast()
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [selectedPrivileges, setSelectedPrivileges] = useState<SharePrivilege[]>(["view", "feedback"])
  const [recipientEmail, setRecipientEmail] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([])
  const [selectedMember, setSelectedMember] = useState<CompanyMember | null>(null)

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

  useEffect(() => {
    const user = getSessionUser()
    if (user?.currentCompanyId) {
      const members = getCompanyMembers(user.currentCompanyId)
      setCompanyMembers(members)
    }
  }, [])

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

  const handleShare = () => {
    setSelectedPrivileges(["view", "feedback"])
    setRecipientEmail("")
    setRecipientName("")
    setSelectedMember(null)
    setShowShareModal(true)
  }

  const handleSelectMember = (member: CompanyMember) => {
    setSelectedMember(member)
    setRecipientEmail(member.email)
    setRecipientName(member.name)
  }

  const handlePrivilegeToggle = (privilege: SharePrivilege) => {
    setSelectedPrivileges((prev) => {
      const newPrivileges = prev.includes(privilege) ? prev.filter((p) => p !== privilege) : [...prev, privilege]

      if (newPrivileges.length > 0 && !newPrivileges.includes("view")) {
        newPrivileges.unshift("view")
      }

      return newPrivileges
    })
  }

  const generateShareUrl = () => {
    const user = getSessionUser()
    if (!user || selectedPrivileges.length === 0) return

    const shareLink = createShareLink({
      userId: user.id,
      companyId: user.currentCompanyId!,
      month: currentMonth,
      year: currentYear,
      platform: selectedPlatform || undefined,
      privileges: selectedPrivileges,
      recipientEmail: recipientEmail || undefined,
      recipientName: recipientName || undefined,
    })

    const params = new URLSearchParams({
      shareId: shareLink.id,
      month: currentMonth.toString(),
      year: currentYear.toString(),
      platform: selectedPlatform || "all",
      privileges: selectedPrivileges.join(","),
    })

    const baseUrl = window.location.origin
    const generatedUrl = `${baseUrl}/shared/monthly-overview?${params.toString()}`
    setShareUrl(generatedUrl)

    createNotification(
      "share",
      "Content Shared",
      `Monthly overview shared with ${recipientName || recipientEmail || "recipient"} with ${selectedPrivileges.join(", ")} privileges.`,
      {
        shareId: shareLink.id,
        recipient: recipientName || recipientEmail,
        privileges: selectedPrivileges,
      },
    )
  }

  const handleCopyUrl = async () => {
    if (!shareUrl) {
      generateShareUrl()
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      showToast({
        type: "success",
        title: "Link Copied",
        message: "Shareable link has been copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      showToast({
        type: "error",
        title: "Copy Failed",
        message: "Failed to copy link to clipboard.",
      })
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
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <CardTitle className="text-lg">Monthly Posts Overview</CardTitle>
              {availablePlatforms.length > 0 && (
                <>
                  <span className="text-muted-foreground hidden sm:inline">|</span>
                  <div className="flex items-center gap-2">
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
                          <Icon
                            className={`h-3 w-3 sm:h-4 sm:w-4 ${selectedPlatform === platform ? "" : config.color}`}
                          />
                          <span className="hidden sm:inline">{config.name}</span>
                        </Button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" size="sm" onClick={handleShare} className="h-8 px-3 bg-transparent">
                <Share2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Share</span>
              </Button>
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
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-max lg:min-w-0">
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
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-4 mb-0">
                  Content
                </h3>
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

      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Monthly Overview</DialogTitle>
            <DialogDescription>
              Share this monthly posts overview with specific privileges. Choose what recipients can do with the shared
              content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {companyMembers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quick Select from Company Members</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {companyMembers.map((member) => (
                    <Button
                      key={member.id}
                      variant={selectedMember?.id === member.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSelectMember(member)}
                      className="justify-start h-auto p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium text-sm">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
                <Separator />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient-name">Recipient Name (Optional)</Label>
                <Input
                  id="recipient-name"
                  placeholder="John Doe"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient-email">Recipient Email (Optional)</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="john@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Access Privileges</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRIVILEGE_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const isSelected = selectedPrivileges.includes(option.value)
                  const isViewRequired = option.value !== "view" && selectedPrivileges.some((p) => p !== "view")

                  return (
                    <div
                      key={option.value}
                      className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handlePrivilegeToggle(option.value)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handlePrivilegeToggle(option.value)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${option.color}`} />
                          <span className="font-medium text-sm">{option.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {selectedPrivileges.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Please select at least one privilege to generate a shareable link.
                </p>
              )}
            </div>

            {selectedPrivileges.length > 0 && (
              <div className="space-y-3">
                <Label htmlFor="share-url">Shareable Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                    placeholder="Click 'Generate & Copy' to create link"
                  />
                  <Button size="sm" onClick={handleCopyUrl} className="px-3">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Recipients will be able to:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedPrivileges.includes("view") && (
                      <li>
                        View all posts for {monthNames[currentMonth]} {currentYear}
                      </li>
                    )}
                    {selectedPrivileges.includes("feedback") && <li>Add feedback and notes to individual posts</li>}
                    {selectedPrivileges.includes("approve") && <li>Update approval status of posts</li>}
                    {selectedPrivileges.includes("edit") && <li>Edit post content and details</li>}
                    <li>Changes sync back to your dashboard in real-time</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
