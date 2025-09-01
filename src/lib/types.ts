export type Platform = "facebook" | "instagram" | "linkedin"

export type Company = {
  id: string
  name: string
  logo?: string
  description?: string
  createdAt: string
  ownerId: string // User who created/owns this company
  members?: string[] // User IDs who have access to this company
}

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
  currentCompanyId?: string | null // Currently selected company
  companies?: string[] // Company IDs user has access to
}

export type Post = {
  id: string
  userId: string
  companyId: string
  platform: Platform
  content: string
  imageUrl?: string
  scheduledAt: string // ISO
  status: "scheduled" | "posted" | "failed"
  link?: string // Add optional link field
  feedback?: string
  boosted?: boolean
  approvalStatus?: string
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
