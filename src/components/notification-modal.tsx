"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Users,
  Calendar,
  Share2,
  Trash2,
  Award as MarkAsRead,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "@/lib/storage"
import type { Notification } from "@/lib/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function NotificationModal({ open, onOpenChange }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open])

  const loadNotifications = () => {
    const userNotifications = getNotifications()
    setNotifications(userNotifications)
  }

  const handleMarkAsRead = (notificationId: string) => {
    setLoading(true)
    setTimeout(() => {
      markNotificationAsRead(notificationId)
      loadNotifications()
      setLoading(false)
    }, 200)
  }

  const handleMarkAllAsRead = () => {
    setLoading(true)
    setTimeout(() => {
      markAllNotificationsAsRead()
      loadNotifications()
      setLoading(false)
    }, 300)
  }

  const handleDeleteNotification = (notificationId: string) => {
    setLoading(true)
    setTimeout(() => {
      deleteNotification(notificationId)
      loadNotifications()
      setLoading(false)
    }, 200)
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      case "share":
        return <Share2 className="h-4 w-4 text-purple-500" />
      case "member":
        return <Users className="h-4 w-4 text-indigo-500" />
      case "schedule":
        return <Calendar className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationBadgeVariant = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "default"
      case "warning":
        return "secondary"
      case "error":
        return "destructive"
      case "info":
        return "outline"
      case "share":
        return "secondary"
      case "member":
        return "outline"
      case "schedule":
        return "secondary"
      default:
        return "outline"
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} disabled={loading} className="text-xs">
                <MarkAsRead className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] px-6">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs">You'll see updates about your posts and activities here</p>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                      !notification.read ? "bg-muted/50 border-primary/20" : "bg-background hover:bg-muted/30",
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={cn("text-sm", !notification.read ? "font-medium" : "font-normal")}>
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
                              {notification.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleDateString()} at{" "}
                              {new Date(notification.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={loading}
                              className="h-6 w-6 p-0"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.id)}
                            disabled={loading}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
