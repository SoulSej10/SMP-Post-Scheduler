"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { User, Save, Camera, CheckCircle, AlertCircle, LogOut, Bell, Shield, Activity, Calendar } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getSessionUser, updateUserProfile, getUserProfile, logoutLocal, getPostsForUser } from "@/lib/storage"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

type UserProfile = {
  id: string
  name: string
  email: string
  phone?: string
  role?: string
  bio?: string
  profilePicture?: string
  onboardingCompleted?: boolean
  preferences?: {
    emailNotifications: boolean
    pushNotifications: boolean
    weeklyReports: boolean
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [stats, setStats] = useState({ totalPosts: 0, scheduledPosts: 0, postedPosts: 0 })

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    bio: "",
    profilePicture: "",
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      weeklyReports: false,
    },
  })

  useEffect(() => {
    const sessionUser = getSessionUser()
    if (!sessionUser) {
      router.push("/login")
      return
    }

    setUser(sessionUser)

    // Load full user profile
    const fullProfile = getUserProfile(sessionUser.id)
    if (fullProfile) {
      setFormData({
        name: fullProfile.name || "",
        email: fullProfile.email || "",
        phone: fullProfile.phone || "",
        role: fullProfile.role || "",
        bio: fullProfile.bio || "",
        profilePicture: fullProfile.profilePicture || "",
        preferences: fullProfile.preferences || {
          emailNotifications: true,
          pushNotifications: true,
          weeklyReports: false,
        },
      })
    }

    const userPosts = getPostsForUser(sessionUser.id, sessionUser.currentCompanyId)
    setStats({
      totalPosts: userPosts.length,
      scheduledPosts: userPosts.filter((p) => p.status === "scheduled").length,
      postedPosts: userPosts.filter((p) => p.status === "posted").length,
    })
  }, [router])

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith("preferences.")) {
      const prefField = field.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleFileUpload = (field: "profilePicture", file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      handleInputChange(field, result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const success = updateUserProfile(user.id, formData)

      if (success) {
        setSaveMessage({ type: "success", text: "Profile updated successfully!" })
        setUser((prev) => (prev ? { ...prev, ...formData } : prev))
      } else {
        setSaveMessage({ type: "error", text: "Failed to update profile. Please try again." })
      }
    } catch (error) {
      setSaveMessage({ type: "error", text: "An error occurred while saving your profile." })
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  const handleLogout = () => {
    logoutLocal()
    router.push("/login")
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-gray-50/50 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Profile Settings</h1>
              <p className="text-muted-foreground">Manage your account information and preferences</p>
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg border ${
                  saveMessage.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {saveMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {saveMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Picture Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Profile Picture
                  </CardTitle>
                  <CardDescription>Upload a profile picture to personalize your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                      {formData.profilePicture ? (
                        <img
                          src={formData.profilePicture || "/placeholder.svg"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-16 w-16 text-gray-400" />
                      )}
                    </div>

                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload("profilePicture", file)
                      }}
                      className="max-w-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Update your personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        disabled // Email shouldn't be editable after registration
                        className="bg-gray-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Your Role</Label>
                      <Input
                        id="role"
                        placeholder="e.g., Marketing Manager, Business Owner"
                        value={formData.role}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us a bit about yourself..."
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">Brief description about yourself (optional)</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Statistics
                  </CardTitle>
                  <CardDescription>Your posting activity and performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Calendar className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold text-blue-900">{stats.totalPosts}</p>
                        <p className="text-sm text-blue-700">Total Posts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <Calendar className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="text-2xl font-bold text-orange-900">{stats.scheduledPosts}</p>
                        <p className="text-sm text-orange-700">Scheduled</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-green-900">{stats.postedPosts}</p>
                        <p className="text-sm text-green-700">Posted</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Manage how you receive updates and notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your posts and schedules
                      </p>
                    </div>
                    <Switch
                      checked={formData.preferences.emailNotifications}
                      onCheckedChange={(checked) => handleInputChange("preferences.emailNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get instant notifications for important updates</p>
                    </div>
                    <Switch
                      checked={formData.preferences.pushNotifications}
                      onCheckedChange={(checked) => handleInputChange("preferences.pushNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly performance summaries via email</p>
                    </div>
                    <Switch
                      checked={formData.preferences.weeklyReports}
                      onCheckedChange={(checked) => handleInputChange("preferences.weeklyReports", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Account Status
                  </CardTitle>
                  <CardDescription>Your account information and current status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Status</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Member since {new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to logout? You will need to sign in again to access your account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                              Logout
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
