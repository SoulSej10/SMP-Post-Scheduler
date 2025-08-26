"use client"

import { useMemo } from "react"
import MiniCalendar from "./mini-calendar"
import type { Post } from "@/lib/types"

type Props = {
  posts: Post[]
  onDateClick?: (date: Date, posts: Post[]) => void
  currentYear: number
  currentMonth: number
}

export default function MobileCalendarFilter({ posts, onDateClick, currentYear, currentMonth }: Props) {
  // Generate only active months for mobile
  const activeMonths = useMemo(() => {
    const months = []

    // Current month first
    months.push({
      month: currentMonth,
      year: currentYear,
      name: new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" }),
      isInactive: false,
    })

    // Only upcoming months (not past months on mobile)
    for (let i = currentMonth + 1; i < 12; i++) {
      months.push({
        month: i,
        year: currentYear,
        name: new Date(currentYear, i).toLocaleString("default", { month: "long" }),
        isInactive: false,
      })
    }

    return months
  }, [currentMonth, currentYear])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:hidden">
      {activeMonths.map(({ month, year, isInactive }) => (
        <MiniCalendar
          key={`${year}-${month}`}
          month={month}
          year={year}
          posts={posts}
          onDateClick={onDateClick}
          className="hover:shadow-md transition-shadow"
          isInactive={isInactive}
        />
      ))}
    </div>
  )
}
