export type Platform = "facebook" | "instagram" | "linkedin"

export type User = {
  id: string
  email: string
  name: string
  passwordHash?: string // mock only
  profilePicture?: string
  company?: string
  companyLogo?: string
  role?: string
  phone?: string
  onboardingCompleted?: boolean
}

export type Post = {
  id: string
  userId: string
  platform: Platform
  content: string
  imageUrl?: string
  scheduledAt: string // ISO
  status: "scheduled" | "posted" | "failed"
  link?: string // Add optional link field
}

export type PlatformSettings = {
  platform: Platform
  scheduleDays: string[] // days of week when this platform should receive posts
  connected: boolean
  username?: string
  lastSync?: string
}

export type OnboardingStep = {
  id: string
  title: string
  description: string
  completed: boolean
}
