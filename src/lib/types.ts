export type Platform = "facebook" | "instagram" | "linkedin"

export type User = {
  id: string
  email: string
  name: string
  passwordHash?: string // mock only
}

export type Post = {
  id: string
  userId: string
  platform: Platform
  content: string
  imageUrl?: string
  scheduledAt: string // ISO
  status: "scheduled" | "posted" | "failed"
}
