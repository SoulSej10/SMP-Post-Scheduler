"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Post } from "@/lib/types"

type Props = {
  posts?: Post[]
  onDateClick?: (date: Date, posts: Post[]) => void
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function getMonthMatrix(viewDate: Date) {
  const start = startOfMonth(viewDate)
  const end = endOfMonth(viewDate)

  const startWeekDay = (start.getDay() + 6) % 7 
  const totalDays = end.getDate()

  const days: Date[] = []
  for (let i = 0; i < startWeekDay; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), 1 - (startWeekDay - i)))
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), d))
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

export default function CalendarView({ posts = [], onDateClick }: Props) {
  const [viewDate, setViewDate] = React.useState<Date>(new Date())

  const weeks = React.useMemo(() => getMonthMatrix(viewDate), [viewDate])

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

  const isSameMonth = (d: Date, ref: Date) => d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
  const todayKey = new Date().toDateString()

  const handleDateClick = (date: Date, dayPosts: Post[]) => {
    if (dayPosts.length > 0 && onDateClick) {
      onDateClick(date, dayPosts)
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-2 font-medium">
            {viewDate.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setViewDate(new Date())}>
          Today
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-md border bg-border">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="bg-muted p-2 text-center text-xs font-medium">
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

            let bgColor = "bg-background"
            if (hasFailedPosts) {
              bgColor = "bg-red-50 hover:bg-red-100"
            } else if (hasPostedPosts) {
              bgColor = "bg-green-50 hover:bg-green-100"
            } else if (hasScheduledPosts) {
              bgColor = "bg-green-50 hover:bg-green-100"
            }

            return (
              <div
                key={`${wi}-${di}`}
                className={[
                  "min-h-24 p-2 transition-colors",
                  bgColor,
                  !isSameMonth(d, viewDate) ? "opacity-40" : "",
                  key === todayKey ? "ring-2 ring-primary ring-inset" : "",
                  dayPosts.length > 0 ? "cursor-pointer" : "",
                ].join(" ")}
                onClick={() => handleDateClick(d, dayPosts)}
              >
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{d.getDate()}</span>
                  <div className="flex items-center gap-1">
                    {key === todayKey && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        Today
                      </Badge>
                    )}
                    {dayPosts.length > 0 && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {dayPosts.length}
                      </Badge>
                    )}
                  </div>
                </div>

                {dayPosts.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(dayPosts.map((p) => p.platform))).map((platform) => (
                      <div
                        key={platform}
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            platform === "facebook"
                              ? "#1877f2"
                              : platform === "instagram"
                                ? "#e4405f"
                                : platform === "linkedin"
                                  ? "#0077b5"
                                  : "#6b7280",
                        }}
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

      <div className="mt-2 text-xs text-muted-foreground">Click on highlighted dates to view scheduled posts</div>
    </div>
  )
}
