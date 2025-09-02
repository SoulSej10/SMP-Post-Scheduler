"use client"

import { useState, useEffect } from "react"
import {
  Home,
  Settings,
  CalendarCheck2,
  Facebook,
  Instagram,
  Linkedin,
  PenTool,
  User,
  LogOut,
  UserCircle,
  Plus,
  Bell,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSessionUser, logoutLocal, getUserProfile, getUnreadNotificationCount } from "@/lib/storage"
import CompanySelector from "@/components/company-selector"
import CreateCompanyModal from "@/components/create-company-modal"
import NotificationModal from "@/components/notification-modal"

type Props = {
  onCompanyChange?: (companyId: string) => void
}

export function AppSidebar({ onCompanyChange }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPlatform = searchParams.get("platform")
  const [userName, setUserName] = useState("User")
  const [userEmail, setUserEmail] = useState("")
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showCreateCompany, setShowCreateCompany] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const user = getSessionUser()
    if (user?.name) {
      setUserName(user.name)
      setUserEmail(user.email)
      // Load full profile for avatar
      const profile = getUserProfile(user.id)
      setUserProfile(profile)
    }
    setUnreadCount(getUnreadNotificationCount())
  }, [])

  useEffect(() => {
    if (!showNotifications) {
      setUnreadCount(getUnreadNotificationCount())
    }
  }, [showNotifications])

  const mainItems = [
    { title: "Dashboard", href: "/", icon: Home },
    { title: "Profile", href: "/profile", icon: UserCircle },
    { title: "Settings", href: "/settings", icon: Settings },
  ]

  const platformItems = [
    { title: "Facebook", platform: "facebook", icon: Facebook, color: "text-blue-600" },
    { title: "Instagram", platform: "instagram", icon: Instagram, color: "text-pink-600" },
    { title: "LinkedIn", platform: "linkedin", icon: Linkedin, color: "text-blue-700" },
  ]

  const handlePlatformClick = (platform: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (currentPlatform === platform) {
      // If clicking the same platform, remove the filter
      params.delete("platform")
    } else {
      // Set the new platform filter
      params.set("platform", platform)
    }

    const newUrl = params.toString() ? `/?${params.toString()}` : "/"
    router.push(newUrl)
  }

  const handleAllSchedulesClick = () => {
    // Clear all filters and go to dashboard
    router.push("/")
  }

  const handleLogout = () => {
    logoutLocal()
    router.push("/login")
  }

  const handleCompanyChange = (companyId: string) => {
    setRefreshKey((prev) => prev + 1)
    // Call the parent's onCompanyChange if provided
    onCompanyChange?.(companyId)
    // Refresh the current page to load data for the new company
    router.refresh()
  }

  const handleCompanyCreated = (companyId: string) => {
    setRefreshKey((prev) => prev + 1)
    // Call the parent's onCompanyChange if provided
    onCompanyChange?.(companyId)
    // Refresh the current page to load data for the new company
    router.refresh()
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 py-2 px-0">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg flex-shrink-0">
              <PenTool className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-bold text-lg">Pen Master</span>
              <span className="text-xs text-muted-foreground">Social Scheduler</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="leading-3">
          <SidebarGroup>
            <SidebarGroupLabel>Company</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-2 px-2">
                <CompanySelector key={refreshKey} onCompanyChange={handleCompanyChange} className="w-full" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateCompany(true)}
                  className="w-full justify-start group-data-[collapsible=icon]:justify-center"
                >
                  <Plus className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden ml-2">New Company</span>
                </Button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Schedules</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleAllSchedulesClick}
                    className={`cursor-pointer ${!currentPlatform ? "bg-accent" : ""}`}
                  >
                    <CalendarCheck2 />
                    <span>All Schedules</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {platformItems.map((item) => (
                  <SidebarMenuItem key={item.platform}>
                    <SidebarMenuButton
                      onClick={() => handlePlatformClick(item.platform)}
                      className={`cursor-pointer ${currentPlatform === item.platform ? "bg-accent" : ""}`}
                    >
                      <item.icon className={item.color} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="w-full" tooltip={`${userName} (${userEmail})`}>
                    {userProfile?.profilePicture ? (
                      <div className="rounded-full overflow-hidden h-7 w-7">
                        <img
                          src={userProfile.profilePicture || "/placeholder.svg"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                      <span className="text-sm font-medium">{userName}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">{userEmail}</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <UserCircle className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowNotifications(true)}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                      </div>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 min-w-5 px-1">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
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

      <CreateCompanyModal
        open={showCreateCompany}
        onOpenChange={setShowCreateCompany}
        onCompanyCreated={handleCompanyCreated}
      />

      <NotificationModal open={showNotifications} onOpenChange={setShowNotifications} />
    </>
  )
}
