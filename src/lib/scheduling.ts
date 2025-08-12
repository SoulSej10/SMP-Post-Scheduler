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
  const scheduleDates = spreadDates(startDate, endDate, frequencyPerWeek)
  const posts: Post[] = []
  let variantIndex = 0
  for (const d of scheduleDates) {
    for (const plat of platforms) {
      const content = variants[variantIndex % variants.length]
      variantIndex++
      posts.push({
        id: uid(),
        userId,
        platform: plat,
        content: content,
        imageUrl,
        scheduledAt: d.toISOString(),
        status: "scheduled",
      })
    }
  }
  // prevent duplicates by content+date+platform
  return dedupe(posts)
}

export function spreadDates(start: string, end: string, perWeek: number): Date[] {
  const s = new Date(start)
  const e = new Date(end)
  if (e < s) return [s]
  const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000)) + 1)
  const weeks = Math.max(1, Math.ceil(days / 7))
  const totalSlots = weeks * Math.max(1, perWeek)
  const result: Date[] = []
  for (let i = 0; i < totalSlots; i++) {
    const t = s.getTime() + Math.round((i / totalSlots) * (e.getTime() - s.getTime()))
    // schedule at 10:00 local by default
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
    const key = `${p.platform}|${new Date(p.scheduledAt).toISOString()}|${hashContent(p.content)}`
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
