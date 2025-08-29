import type { Platform, Post } from "./types"

export function getPlatformScheduleDays(): Record<Platform, string[]> {
  // This would normally come from user settings/database
  // For now, return default preferences that can be overridden
  return {
    facebook: ["monday", "wednesday", "friday"],
    instagram: ["tuesday", "thursday", "saturday"],
    linkedin: ["monday", "tuesday", "wednesday"],
  }
}

export function createPostsForSchedule(args: {
  userId: string
  startDate: string
  endDate: string
  frequencyPerWeek: number
  platforms: Platform[]
  variants: string[]
  imageUrl?: string
  link?: string
}): Post[] {
  const { userId, startDate, endDate, frequencyPerWeek, platforms, variants, imageUrl, link } = args

  const platformScheduleDays = getPlatformScheduleDays()

  // Calculate total posts: frequency * platforms * weeks
  const startMs = new Date(startDate).getTime()
  const endMs = new Date(endDate).getTime()
  const totalDays = Math.max(1, Math.ceil((endMs - startMs) / (24 * 60 * 60 * 1000)) + 1)
  const weeks = Math.max(1, Math.ceil(totalDays / 7))

  // Total posts = frequency per week * number of platforms * number of weeks
  const totalPosts = frequencyPerWeek * platforms.length * weeks

  const scheduleDates = generatePlatformAwareDates(startDate, endDate, totalPosts, platforms, platformScheduleDays)

  const posts: Post[] = []

  // Create posts with platform-aware scheduling
  for (let i = 0; i < Math.min(totalPosts, scheduleDates.length); i++) {
    const scheduleInfo = scheduleDates[i]

    // Use different content for each post (cycle through variants)
    let content = variants[i % variants.length]

    // Only add link to content if provided
    if (link && link.trim()) {
      content = `${content}\n\n🔗 ${link}`
    }

    posts.push({
      id: uid(),
      userId,
      platform: scheduleInfo.platform,
      content,
      imageUrl: imageUrl || "/default-social-post.png",
      scheduledAt: scheduleInfo.date.toISOString(),
      status: "scheduled",
    })
  }

  // Remove duplicates by content+date+platform
  return dedupe(posts)
}

function generatePlatformAwareDates(
  startDate: string,
  endDate: string,
  totalPosts: number,
  platforms: Platform[],
  platformScheduleDays: Record<Platform, string[]>,
): Array<{ platform: Platform; date: Date }> {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const results: Array<{ platform: Platform; date: Date }> = []

  if (totalPosts <= 0) return results

  // Calculate posts per platform
  const postsPerPlatform = Math.ceil(totalPosts / platforms.length)

  for (const platform of platforms) {
    const allowedDays = platformScheduleDays[platform] || ["monday", "tuesday", "wednesday", "thursday", "friday"]
    const allowedDayNumbers = allowedDays.map((day) => {
      const dayMap: Record<string, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      }
      return dayMap[day] ?? 1
    })

    // Generate dates for this platform within the allowed days
    const platformDates = generateDatesForPlatform(start, end, postsPerPlatform, allowedDayNumbers)

    for (const date of platformDates) {
      results.push({ platform, date })
    }
  }

  // Sort by date and limit to requested total
  results.sort((a, b) => a.date.getTime() - b.date.getTime())
  return results.slice(0, totalPosts)
}

function generateDatesForPlatform(start: Date, end: Date, count: number, allowedDayNumbers: number[]): Date[] {
  const dates: Date[] = []
  const totalMs = end.getTime() - start.getTime()
  const totalDays = Math.ceil(totalMs / (24 * 60 * 60 * 1000))

  // Find all valid dates within the range
  const validDates: Date[] = []
  for (let i = 0; i <= totalDays; i++) {
    const currentDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
    if (allowedDayNumbers.includes(currentDate.getDay())) {
      validDates.push(new Date(currentDate))
    }
  }

  // If no valid dates found, fall back to any day
  if (validDates.length === 0) {
    for (let i = 0; i < count && i <= totalDays; i++) {
      const date = new Date(start.getTime() + (i / count) * totalMs)
      validDates.push(date)
    }
  }

  // Select dates evenly distributed across valid dates
  for (let i = 0; i < count && i < validDates.length; i++) {
    const index = Math.floor((i / count) * validDates.length)
    const selectedDate = new Date(validDates[index])

    // Randomize the hour between 9 AM and 6 PM
    const randomHour = 9 + Math.floor(Math.random() * 10) // 9-18 (6 PM)
    const randomMinute = Math.floor(Math.random() * 60)

    selectedDate.setHours(randomHour, randomMinute, 0, 0)
    dates.push(selectedDate)
  }

  return dates
}

function generateRandomDates(startDate: string, endDate: string, count: number): Date[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const dates: Date[] = []

  if (count <= 0) return dates

  const totalMs = end.getTime() - start.getTime()

  for (let i = 0; i < count; i++) {
    // Generate completely random time within the range
    const randomMs = Math.random() * totalMs
    const newDate = new Date(start.getTime() + randomMs)

    // Randomize the hour between 9 AM and 6 PM
    const randomHour = 9 + Math.floor(Math.random() * 10) // 9-18 (6 PM)
    const randomMinute = Math.floor(Math.random() * 60)

    newDate.setHours(randomHour, randomMinute, 0, 0)
    dates.push(newDate)
  }

  // Sort dates chronologically
  return dates.sort((a, b) => a.getTime() - b.getTime())
}

export function spreadDates(start: string, end: string, perWeek: number): Date[] {
  // This function is kept for backward compatibility but not used in the new logic
  const s = new Date(start)
  const e = new Date(end)
  if (e < s) return [s]
  const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000)) + 1)
  const weeks = Math.max(1, Math.ceil(days / 7))
  const totalSlots = weeks * Math.max(1, perWeek)
  const result: Date[] = []
  for (let i = 0; i < totalSlots; i++) {
    const t = s.getTime() + Math.round((i / totalSlots) * (e.getTime() - s.getTime()))
    const d = new Date(t)
    d.setHours(10, 0, 0, 0)
    result.push(d)
  }
  return result
}

export function normalizeContent(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim()
}

export function hashContent(s: string) {
  // simple djb2
  const str = normalizeContent(s)
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

export function dedupe(posts: Post[]): Post[] {
  const seen = new Set<string>()
  const out: Post[] = []
  for (const p of posts) {
    const key = `${p.platform}|${new Date(p.scheduledAt).toDateString()}|${hashContent(p.content)}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(p)
    }
  }
  return out
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as any).randomUUID() as string
  }
  return Math.random().toString(36).slice(2)
}
