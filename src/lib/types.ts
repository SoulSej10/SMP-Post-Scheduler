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

export type Preferences = {
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyReports: boolean
}

export type User = {
  id: string
  email: string
  name: string
  passwordHash?: string 
  profilePicture?: string
  company?: string
  companyLogo?: string
  role?: string
  phone?: string
  onboardingCompleted?: boolean
  currentCompanyId?: string | null // Currently selected company
  companies?: string[] // Company IDs user has access to
  bio?: string   
  preferences?: Preferences
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

export type Notification = {
  id: string
  userId: string
  companyId?: string
  type: "success" | "warning" | "error" | "info" | "share" | "member" | "schedule"
  title: string
  message?: string
  read: boolean
  createdAt: string
  data?: any // Additional data for the notification
}

export type SharePrivilege = "view" | "feedback" | "approve" | "edit"

export type ShareLink = {
  id: string
  userId: string
  companyId: string
  month: number
  year: number
  platform?: Platform
  privileges: SharePrivilege[]
  recipientEmail?: string
  recipientName?: string
  expiresAt?: string
  createdAt: string
  accessCount: number
  lastAccessedAt?: string
}

export type CompanyMember = {
  id: string
  companyId: string
  userId?: string // If registered user
  email: string
  name: string
  role: "owner" | "admin" | "member" | "viewer"
  invitedAt: string
  joinedAt?: string
  status: "pending" | "active" | "inactive"
}
