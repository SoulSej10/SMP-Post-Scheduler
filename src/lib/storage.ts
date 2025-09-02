import type { Post, User, Company, Notification, CompanyMember, ShareLink, SharePrivilege, Platform } from "./types"

const USERS_KEY = "smp:users"
const SESSION_KEY = "smp:session"
const SETTINGS_KEY = "smp:settings"
const COMPANIES_KEY = "smp:companies"
const NOTIFICATIONS_KEY = "smp:notifications"
const COMPANY_MEMBERS_KEY = "smp:company-members"
const SHARE_LINKS_KEY = "smp:share-links"

type Settings = {
  n8nWebhookUrl?: string
}

export function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as User[]) : []
  } catch {
    return []
  }
}

export function registerLocal({ email, password, name }: { email: string; password: string; name: string }) {
  const users = getUsers()
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false as const, error: "Email already registered" }
  }
  const id = cryptoRandomId()
  const user: User = {
    id,
    email,
    name,
    passwordHash: btoa(password), // mock only
    onboardingCompleted: false, // New users need onboarding
    companies: [], // Initialize companies array
    currentCompanyId: null, // Initialize current company ID
  }
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]))
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id, email, name, onboardingCompleted: false, companies: [], currentCompanyId: null }),
  )
  return { ok: true as const }
}

export function loginLocal(email: string, password: string) {
  const users = getUsers()
  const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.passwordHash === btoa(password))
  if (!u) return false
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: u.id,
      email: u.email,
      name: u.name,
      onboardingCompleted: u.onboardingCompleted || false,
      companies: u.companies || [],
      currentCompanyId: u.currentCompanyId,
    }),
  )
  return true
}

export function getSessionUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw
      ? (JSON.parse(raw) as Pick<User, "id" | "email" | "name"> & {
          onboardingCompleted?: boolean
          companies?: string[]
          currentCompanyId?: string
        })
      : null
  } catch {
    return null
  }
}

export function updateUserProfile(userId: string, profileData: Partial<User>) {
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...profileData }
    localStorage.setItem(USERS_KEY, JSON.stringify(users))

    // Update session if it's the current user
    const session = getSessionUser()
    if (session && session.id === userId) {
      const updatedSession = { ...session, ...profileData }
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession))
    }
    return true
  }
  return false
}

export function getUserProfile(userId: string): User | null {
  const users = getUsers()
  return users.find((u) => u.id === userId) || null
}

export function completeOnboarding(userId: string) {
  return updateUserProfile(userId, { onboardingCompleted: true })
}

export function logoutLocal() {
  localStorage.removeItem(SESSION_KEY)
}

export function getPostsForUser(userId: string, companyId?: string): Post[] {
  try {
    const raw = localStorage.getItem(`smp:posts:${userId}`)
    const posts = raw ? (JSON.parse(raw) as Post[]) : []

    // Filter by company if specified
    if (companyId) {
      return posts.filter((post) => post.companyId === companyId)
    }

    return posts
  } catch {
    return []
  }
}

export function savePosts(userId: string, posts: Post[]) {
  localStorage.setItem(`smp:posts:${userId}`, JSON.stringify(posts))
}

export function updatePost(userId: string, updatedPost: Post) {
  const posts = getPostsForUser(userId)
  const index = posts.findIndex((p) => p.id === updatedPost.id)
  if (index !== -1) {
    const oldPost = posts[index]
    posts[index] = updatedPost
    savePosts(userId, posts)

    // Create notification for post update
    createNotification("info", "Post Updated", `Your ${updatedPost.platform} post has been updated successfully.`, {
      postId: updatedPost.id,
      platform: updatedPost.platform,
    })

    return true
  }
  return false
}

export function deletePost(userId: string, postId: string) {
  const posts = getPostsForUser(userId)
  const postToDelete = posts.find((p) => p.id === postId)
  const filtered = posts.filter((p) => p.id !== postId)
  savePosts(userId, filtered)

  if (filtered.length < posts.length && postToDelete) {
    // Create notification for post deletion
    createNotification("warning", "Post Deleted", `Your ${postToDelete.platform} post has been deleted.`, {
      postId,
      platform: postToDelete.platform,
    })
  }

  return filtered.length < posts.length
}

export function deletePosts(userId: string, postIds: string[]) {
  const posts = getPostsForUser(userId)
  const filtered = posts.filter((p) => !postIds.includes(p.id))
  savePosts(userId, filtered)

  if (filtered.length < posts.length) {
    // Create notification for bulk deletion
    createNotification("warning", "Posts Deleted", `Successfully deleted ${postIds.length} posts.`, {
      deletedCount: postIds.length,
    })
  }

  return filtered.length < posts.length
}

export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? (JSON.parse(raw) as Settings) : {}
  } catch {
    return {}
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export async function sendToN8n(post: Post) {
  const s = getSettings()
  if (!s.n8nWebhookUrl) return false
  try {
    const res = await fetch(s.n8nWebhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(post),
    })
    return res.ok
  } catch {
    return false
  }
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as any).randomUUID() as string
  }
  return Math.random().toString(36).slice(2)
}

export function getCompanies(): Company[] {
  try {
    const raw = localStorage.getItem(COMPANIES_KEY)
    return raw ? (JSON.parse(raw) as Company[]) : []
  } catch {
    return []
  }
}

export function saveCompanies(companies: Company[]) {
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies))
}

export function createCompany(name: string, description = "", ownerId: string): Company {
  const companies = getCompanies()
  const newCompany: Company = {
    id: cryptoRandomId(),
    name,
    description,
    createdAt: new Date().toISOString(),
    ownerId,
    members: [ownerId],
  }

  companies.push(newCompany)
  saveCompanies(companies)

  // Add company to user's companies list
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.id === ownerId)
  if (userIndex !== -1) {
    users[userIndex].companies = [...(users[userIndex].companies || []), newCompany.id]
    users[userIndex].currentCompanyId = newCompany.id
    localStorage.setItem(USERS_KEY, JSON.stringify(users))

    // Update session
    const session = getSessionUser()
    if (session && session.id === ownerId) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          ...session,
          currentCompanyId: newCompany.id,
          companies: users[userIndex].companies,
        }),
      )
    }
  }

  return newCompany
}

export function getUserCompanies(userId: string): Company[] {
  const companies = getCompanies()
  return companies.filter(
    (company) => company.ownerId === userId || (company.members && company.members.includes(userId)),
  )
}

export function getCompanyById(companyId: string): Company | null {
  const companies = getCompanies()
  return companies.find((c) => c.id === companyId) || null
}

export function switchUserCompany(userId: string, companyId: string): boolean {
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex !== -1) {
    const userCompanies = getUserCompanies(userId)
    const hasAccess = userCompanies.some((c) => c.id === companyId)

    if (hasAccess) {
      const company = getCompanyById(companyId)
      users[userIndex].currentCompanyId = companyId
      localStorage.setItem(USERS_KEY, JSON.stringify(users))

      // Update session
      const session = getSessionUser()
      if (session && session.id === userId) {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            ...session,
            currentCompanyId: companyId,
          }),
        )
      }

      // Create notification for company switch
      if (company) {
        createNotification("info", "Company Switched", `Successfully switched to ${company.name}.`, {
          companyId,
          companyName: company.name,
        })
      }

      return true
    }
  }
  return false
}

export function updatePostStatusBasedOnDate() {
  const users = getUsers()
  const now = new Date()

  users.forEach((user) => {
    const posts = getPostsForUser(user.id)
    let hasUpdates = false

    const updatedPosts = posts.map((post) => {
      const scheduledDate = new Date(post.scheduledAt)
      const dayAfterScheduled = new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000)

      // If post was scheduled for yesterday or earlier and still has "scheduled" status, mark as failed
      if (post.status === "scheduled" && now > dayAfterScheduled) {
        hasUpdates = true
        return { ...post, status: "failed" as const }
      }

      return post
    })

    if (hasUpdates) {
      savePosts(user.id, updatedPosts)
    }
  })
}

export function getHistoricalPostData(userId: string, companyId?: string, days = 30): number[] {
  const posts = getPostsForUser(userId, companyId)
  const now = new Date()
  const data: number[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

    const dayPosts = posts.filter((post) => {
      const postDate = new Date(post.scheduledAt)
      return postDate >= dayStart && postDate < dayEnd
    })

    data.push(dayPosts.length)
  }

  return data
}

export function getSuccessRateData(userId: string, companyId?: string, days = 30): number[] {
  const posts = getPostsForUser(userId, companyId)
  const now = new Date()
  const data: number[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

    const dayPosts = posts.filter((post) => {
      const postDate = new Date(post.scheduledAt)
      return postDate >= dayStart && postDate < dayEnd
    })

    if (dayPosts.length === 0) {
      data.push(0)
    } else {
      const successfulPosts = dayPosts.filter((post) => post.status === "posted").length
      const successRate = Math.round((successfulPosts / dayPosts.length) * 100)
      data.push(successRate)
    }
  }

  return data
}

export function getNotifications(): Notification[] {
  try {
    const user = getSessionUser()
    if (!user) return []

    const raw = localStorage.getItem(`${NOTIFICATIONS_KEY}:${user.id}`)
    const notifications = raw ? (JSON.parse(raw) as Notification[]) : []

    // Sort by creation date, newest first
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

export function saveNotifications(userId: string, notifications: Notification[]) {
  localStorage.setItem(`${NOTIFICATIONS_KEY}:${userId}`, JSON.stringify(notifications))
}

export function createNotification(
  type: Notification["type"],
  title: string,
  message?: string,
  data?: any,
): Notification {
  const user = getSessionUser()
  if (!user) throw new Error("No user session found")

  const notification: Notification = {
    id: cryptoRandomId(),
    userId: user.id,
    companyId: user.currentCompanyId,
    type,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    data,
  }

  const notifications = getNotifications()
  notifications.unshift(notification) // Add to beginning

  // Keep only last 50 notifications to prevent storage bloat
  const trimmedNotifications = notifications.slice(0, 50)
  saveNotifications(user.id, trimmedNotifications)

  return notification
}

export function markNotificationAsRead(notificationId: string): boolean {
  const user = getSessionUser()
  if (!user) return false

  const notifications = getNotifications()
  const notificationIndex = notifications.findIndex((n) => n.id === notificationId)

  if (notificationIndex !== -1) {
    notifications[notificationIndex].read = true
    saveNotifications(user.id, notifications)
    return true
  }

  return false
}

export function markAllNotificationsAsRead(): boolean {
  const user = getSessionUser()
  if (!user) return false

  const notifications = getNotifications()
  const updatedNotifications = notifications.map((n) => ({ ...n, read: true }))
  saveNotifications(user.id, updatedNotifications)

  return true
}

export function deleteNotification(notificationId: string): boolean {
  const user = getSessionUser()
  if (!user) return false

  const notifications = getNotifications()
  const filteredNotifications = notifications.filter((n) => n.id !== notificationId)
  saveNotifications(user.id, filteredNotifications)

  return filteredNotifications.length < notifications.length
}

export function getUnreadNotificationCount(): number {
  const notifications = getNotifications()
  return notifications.filter((n) => !n.read).length
}

export function getCompanyMembers(companyId: string): CompanyMember[] {
  try {
    const raw = localStorage.getItem(`${COMPANY_MEMBERS_KEY}:${companyId}`)
    return raw ? (JSON.parse(raw) as CompanyMember[]) : []
  } catch {
    return []
  }
}

export function saveCompanyMembers(companyId: string, members: CompanyMember[]) {
  localStorage.setItem(`${COMPANY_MEMBERS_KEY}:${companyId}`, JSON.stringify(members))
}

export function addCompanyMember(
  companyId: string,
  email: string,
  name: string,
  role: CompanyMember["role"] = "member",
): CompanyMember {
  const members = getCompanyMembers(companyId)
  const newMember: CompanyMember = {
    id: cryptoRandomId(),
    companyId,
    email,
    name,
    role,
    invitedAt: new Date().toISOString(),
    status: "pending",
  }

  members.push(newMember)
  saveCompanyMembers(companyId, members)

  // Create notification for member invitation
  createNotification("member", "Member Invited", `${name} (${email}) has been invited to join the company.`, {
    memberId: newMember.id,
    email,
    name,
    role,
  })

  return newMember
}

export function removeCompanyMember(companyId: string, memberId: string): boolean {
  const members = getCompanyMembers(companyId)
  const filteredMembers = members.filter((m) => m.id !== memberId)
  saveCompanyMembers(companyId, filteredMembers)

  // Create notification for member removal
  const removedMember = members.find((m) => m.id === memberId)
  if (removedMember) {
    createNotification("member", "Member Removed", `${removedMember.name} has been removed from the company.`, {
      memberId,
      email: removedMember.email,
      name: removedMember.name,
    })
  }

  return filteredMembers.length < members.length
}

export function updateCompanyMember(companyId: string, memberId: string, updates: Partial<CompanyMember>): boolean {
  const members = getCompanyMembers(companyId)
  const memberIndex = members.findIndex((m) => m.id === memberId)

  if (memberIndex !== -1) {
    members[memberIndex] = { ...members[memberIndex], ...updates }
    saveCompanyMembers(companyId, members)

    // Create notification for role update
    if (updates.role) {
      createNotification(
        "member",
        "Member Role Updated",
        `${members[memberIndex].name}'s role has been updated to ${updates.role}.`,
        {
          memberId,
          email: members[memberIndex].email,
          name: members[memberIndex].name,
          newRole: updates.role,
        },
      )
    }

    return true
  }

  return false
}

export function getShareLinks(): ShareLink[] {
  try {
    const user = getSessionUser()
    if (!user) return []

    const raw = localStorage.getItem(`${SHARE_LINKS_KEY}:${user.id}`)
    return raw ? (JSON.parse(raw) as ShareLink[]) : []
  } catch {
    return []
  }
}

export function saveShareLinks(userId: string, shareLinks: ShareLink[]) {
  localStorage.setItem(`${SHARE_LINKS_KEY}:${userId}`, JSON.stringify(shareLinks))
}

export function createShareLink(data: {
  userId: string
  companyId: string
  month: number
  year: number
  platform?: Platform
  privileges: SharePrivilege[]
  recipientEmail?: string
  recipientName?: string
  expiresAt?: string
}): ShareLink {
  const shareLink: ShareLink = {
    id: cryptoRandomId(),
    ...data,
    createdAt: new Date().toISOString(),
    accessCount: 0,
  }

  const shareLinks = getShareLinks()
  shareLinks.push(shareLink)
  saveShareLinks(data.userId, shareLinks)

  return shareLink
}

export function getShareLinkById(shareId: string): ShareLink | null {
  const users = getUsers()

  for (const user of users) {
    try {
      const raw = localStorage.getItem(`${SHARE_LINKS_KEY}:${user.id}`)
      if (raw) {
        const shareLinks = JSON.parse(raw) as ShareLink[]
        const shareLink = shareLinks.find((link) => link.id === shareId)
        if (shareLink) {
          return shareLink
        }
      }
    } catch {
      continue
    }
  }

  return null
}

export function incrementShareLinkAccess(shareId: string): boolean {
  const users = getUsers()

  for (const user of users) {
    try {
      const raw = localStorage.getItem(`${SHARE_LINKS_KEY}:${user.id}`)
      if (raw) {
        const shareLinks = JSON.parse(raw) as ShareLink[]
        const linkIndex = shareLinks.findIndex((link) => link.id === shareId)
        if (linkIndex !== -1) {
          shareLinks[linkIndex].accessCount += 1
          shareLinks[linkIndex].lastAccessedAt = new Date().toISOString()
          saveShareLinks(user.id, shareLinks)
          return true
        }
      }
    } catch {
      continue
    }
  }

  return false
}
