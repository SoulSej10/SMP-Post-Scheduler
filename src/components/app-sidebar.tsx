"use client"

import { Home, Settings, CalendarCheck2, Facebook, Instagram, Linkedin, PenTool } from "lucide-react"
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

export function AppSidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPlatform = searchParams.get("platform")

  const mainItems = [
    { title: "Dashboard", href: "/", icon: Home },
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <PenTool className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg">Pen Master</span>
            <span className="text-xs text-muted-foreground">Social Scheduler</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
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
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  )
}
