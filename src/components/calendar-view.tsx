"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import type { Post } from "@/lib/types"

type Props = {
  posts?: Post[]
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

export default function CalendarView({ posts = [] }: Props) {
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
            return (
              <div
                key={`${wi}-${di}`}
                className={[
                  "min-h-24 bg-background p-2",
                  !isSameMonth(d, viewDate) ? "bg-muted/30" : "",
                  key === todayKey ? "ring-1 ring-primary" : "",
                ].join(" ")}
              >
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{d.getDate()}</span>
                  {key === todayKey && <Badge variant="secondary">Today</Badge>}
                </div>
                <div className="flex flex-col gap-1">
                  {dayPosts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="truncate rounded border px-2 py-1 text-xs"
                      title={`${p.platform} • ${p.status}\n${p.content}`}
                    >
                      <span className="mr-1 rounded bg-muted px-1 py-0.5 uppercase">{p.platform.slice(0, 2)}</span>
                      <span className="opacity-80">{p.content}</span>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{dayPosts.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
