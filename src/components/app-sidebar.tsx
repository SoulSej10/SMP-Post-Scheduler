"use client"

import { Home, Settings, CalendarCheck2 } from "lucide-react"
import Link from "next/link"
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
} from "./ui/sidebar"

export function AppSidebar() {
  const items = [
    { title: "Dashboard", href: "/", icon: Home },
    { title: "Schedules", href: "/", icon: CalendarCheck2 },
    { title: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((i) => (
                <SidebarMenuItem key={i.title}>
                  <SidebarMenuButton asChild>
                    <Link href={i.href} className="flex items-center gap-2">
                      <i.icon className="w-4 h-4" /> {/* Adjust icon size if needed */}
                      <span className="text-lg font-small">{i.title}</span> {/* Larger text */}
                    </Link>
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
