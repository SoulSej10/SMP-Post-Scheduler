"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Post } from "@/lib/types"

type Props = {
  month: number // 0-11
  year: number
  posts?: Post[]
  onDateClick?: (date: Date, posts: Post[]) => void
  className?: string
  isInactive?: boolean // New prop to indicate if month is in the past
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1)
}

function endOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0)
}

function getMonthMatrix(year: number, month: number) {
  const start = startOfMonth(year, month)
  const end = endOfMonth(year, month)

  const startWeekDay = (start.getDay() + 6) % 7 // ISO-like: Monday=0
  const totalDays = end.getDate()

  const days: Date[] = []
  for (let i = 0; i < startWeekDay; i++) {
    days.push(new Date(year, month, 1 - (startWeekDay - i)))
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(year, month, d))
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1]
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1))
  }
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  return weeks
}

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

export default function MiniCalendar({
  month,
  year,
  posts = [],
  onDateClick,
  className = "",
  isInactive = false,
}: Props) {
  const weeks = React.useMemo(() => getMonthMatrix(year, month), [year, month])

  const postsByDay = React.useMemo(() => {
    const map: Record<string, Post[]> = {}
    posts.forEach((p) => {
      const d = new Date(p.scheduledAt)
      const key = d.toDateString()
      map[key] = map[key] || []
      map[key].push(p)
    })
    return map
  }, [posts])

  const isSameMonth = (d: Date, refYear: number, refMonth: number) =>
    d.getMonth() === refMonth && d.getFullYear() === refYear

  const todayKey = new Date().toDateString()
  const isCurrentMonth = new Date().getMonth() === month && new Date().getFullYear() === year

  const handleDateClick = (date: Date, dayPosts: Post[]) => {
    if (onDateClick) {
      onDateClick(date, dayPosts)
    }
  }

  return (
    <Card className={`${className} ${isInactive ? "opacity-60 bg-muted/30" : ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-medium text-center ${isInactive ? "text-muted-foreground" : ""}`}>
          {monthNames[month]} {year}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="grid grid-cols-7 gap-px text-xs">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="text-center text-muted-foreground font-medium p-1">
              {d}
            </div>
          ))}
          {weeks.map((w, wi) =>
            w.map((d, di) => {
              const key = d.toDateString()
              const dayPosts = postsByDay[key] || []
              const hasScheduledPosts = dayPosts.some((p) => p.status === "scheduled")
              const hasPostedPosts = dayPosts.some((p) => p.status === "posted")
              const hasFailedPosts = dayPosts.some((p) => p.status === "failed")

              // Determine styling classes based on post status
              let dateClasses = ""
              if (hasFailedPosts) {
                dateClasses = "calendar-date-failed"
              } else if (hasPostedPosts) {
                dateClasses = "calendar-date-posted"
              } else if (hasScheduledPosts) {
                dateClasses = "calendar-date-scheduled"
              }

              const isToday = key === todayKey && isCurrentMonth

              return (
                <div
                  key={`${wi}-${di}`}
                  className={[
                    "aspect-square flex items-center justify-center text-xs cursor-pointer transition-all duration-200 relative rounded-sm",
                    dateClasses || (isInactive ? "hover:bg-muted/50" : "hover:bg-accent"),
                    !isSameMonth(d, year, month) ? "opacity-40" : "",
                    isToday ? "ring-2 ring-primary ring-inset font-bold" : "",
                    isInactive && !dayPosts.length ? "cursor-default" : "",
                    dayPosts.length > 0 ? "font-medium" : "",
                  ].join(" ")}
                  onClick={() => handleDateClick(d, dayPosts)}
                >
                  <span className="relative z-10">{d.getDate()}</span>
                  {dayPosts.length > 0 && (
                    <div className="absolute bottom-0 right-0 flex gap-0.5">
                      {Array.from(new Set(dayPosts.map((p) => p.platform))).map((platform) => (
                        <div
                          key={platform}
                          className={[
                            "w-1.5 h-1.5 rounded-full",
                            platform === "facebook" ? "platform-dot-facebook" : "",
                            platform === "instagram" ? "platform-dot-instagram" : "",
                            platform === "linkedin" ? "platform-dot-linkedin" : "",
                          ].join(" ")}
                          title={platform}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            }),
          )}
        </div>
      </CardContent>
    </Card>
  )
}
