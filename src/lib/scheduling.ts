import type { Platform, Post } from "./types"

export function createPostsForSchedule(args: {
  userId: string
  startDate: string
  endDate: string
  frequencyPerWeek: number
  platforms: Platform[]
  variants: string[]
  imageUrl?: string
}): Post[] {
  const { userId, startDate, endDate, frequencyPerWeek, platforms, variants, imageUrl } = args

  // Calculate total posts based on actual days, not rounded weeks
  const startMs = new Date(startDate).getTime()
  const endMs = new Date(endDate).getTime()
  const totalDays = Math.max(1, Math.ceil((endMs - startMs) / (24 * 60 * 60 * 1000)) + 1)

  // Calculate posts per day across all platforms
  const postsPerDay = (frequencyPerWeek * platforms.length) / 7
  const totalPosts = Math.round(totalDays * postsPerDay)

  // Generate random dates for all posts
  const scheduleDates = generateRandomDates(startDate, endDate, totalPosts)

  const posts: Post[] = []

  // Create posts with truly random platform assignment
  for (let i = 0; i < totalPosts && i < scheduleDates.length; i++) {
    // Randomly select platform for each post
    const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)]
    const content = variants[i % variants.length]

    posts.push({
      id: uid(),
      userId,
      platform: randomPlatform,
      content,
      imageUrl: imageUrl || "/default-social-post.png",
      scheduledAt: scheduleDates[i].toISOString(),
      status: "scheduled",
    })
  }

  // Remove duplicates by content+date+platform
  return dedupe(posts)
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
