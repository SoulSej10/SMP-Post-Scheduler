import type { Post, User, Company, Notification, CompanyMember, ShareLink, SharePrivilege, Platform } from "./types"

export type SocialAccount = {
  id: string
  platform: Platform
  connected: boolean
  username: string | null
  lastSync: string | null
  scheduleDays: string[]
}

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T | null }> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data }
}

// ---------- Auth ----------

export async function registerLocal({ email, password, name }: { email: string; password: string; name: string }) {
  const { ok, data } = await api<{ error?: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  })
  if (!ok) return { ok: false as const, error: data?.error ?? "Registration failed" }
  return { ok: true as const }
}

export async function loginLocal(email: string, password: string) {
  const { ok } = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  return ok
}

export async function logoutLocal() {
  await api("/api/auth/logout", { method: "POST" })
}

export async function getSessionUser(): Promise<User | null> {
  const { ok, data } = await api<{ user: User }>("/api/auth/me")
  if (!ok) return null
  return data?.user ?? null
}

export async function updateUserProfile(_userId: string, profileData: Partial<User>) {
  const { ok } = await api("/api/users/me", { method: "PATCH", body: JSON.stringify(profileData) })
  return ok
}

export async function getUserProfile(_userId: string): Promise<User | null> {
  return getSessionUser()
}

export async function completeOnboarding(userId: string) {
  return updateUserProfile(userId, { onboardingCompleted: true })
}

// ---------- Posts ----------

export async function getPostsForUser(_userId: string, companyId?: string | null): Promise<Post[]> {
  if (!companyId) return []
  const { ok, data } = await api<{ posts: Post[] }>(`/api/posts?companyId=${encodeURIComponent(companyId)}`)
  return ok && data ? data.posts : []
}

export async function createPosts(posts: Post[]): Promise<Post[]> {
  const { ok, data } = await api<{ posts: Post[] }>("/api/posts", {
    method: "POST",
    body: JSON.stringify({ posts }),
  })
  return ok && data ? data.posts : []
}

export async function updatePost(_userId: string, updatedPost: Post) {
  const { ok } = await api(`/api/posts/${updatedPost.id}`, {
    method: "PATCH",
    body: JSON.stringify(updatedPost),
  })
  return ok
}

export async function deletePost(_userId: string, postId: string) {
  const { ok } = await api(`/api/posts/${postId}`, { method: "DELETE" })
  return ok
}

export async function deletePosts(_userId: string, postIds: string[]) {
  const { ok } = await api("/api/posts", { method: "DELETE", body: JSON.stringify({ ids: postIds }) })
  return ok
}

export function getHistoricalPostData(posts: Post[], days = 30): number[] {
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

export function getSuccessRateData(posts: Post[], days = 30): number[] {
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
      data.push(Math.round((successfulPosts / dayPosts.length) * 100))
    }
  }

  return data
}

export async function publishPost(postId: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await api<{ error?: string }>(`/api/posts/${postId}/publish`, { method: "POST" })
  if (!ok) return { ok: false, error: data?.error ?? "Publish failed" }
  return { ok: true }
}

// ---------- Companies ----------

export async function createCompany(
  name: string,
  description = "",
  _ownerId?: string,
  logo?: string,
): Promise<Company | null> {
  const { ok, data } = await api<{ company: Company }>("/api/companies", {
    method: "POST",
    body: JSON.stringify({ name, description, logo }),
  })
  return ok && data ? data.company : null
}

export async function getUserCompanies(_userId: string): Promise<Company[]> {
  const { ok, data } = await api<{ companies: Company[] }>("/api/companies")
  return ok && data ? data.companies : []
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  const { ok, data } = await api<{ company: Company }>(`/api/companies/${companyId}`)
  return ok && data ? data.company : null
}

export async function switchUserCompany(_userId: string, companyId: string): Promise<boolean> {
  return updateUserProfile(_userId, { currentCompanyId: companyId })
}

export async function updateCompany(
  companyId: string,
  updates: { name?: string; description?: string; logo?: string },
): Promise<boolean> {
  const { ok } = await api(`/api/companies/${companyId}`, { method: "PATCH", body: JSON.stringify(updates) })
  return ok
}

export async function deleteCompany(companyId: string): Promise<boolean> {
  const { ok } = await api(`/api/companies/${companyId}`, { method: "DELETE" })
  return ok
}

// ---------- Social accounts ----------

export async function getSocialAccounts(companyId: string): Promise<SocialAccount[]> {
  const { ok, data } = await api<{ accounts: SocialAccount[] }>(`/api/companies/${companyId}/social-accounts`)
  return ok && data ? data.accounts : []
}

export async function disconnectSocialAccount(accountId: string): Promise<boolean> {
  const { ok } = await api(`/api/social-accounts/${accountId}`, { method: "DELETE" })
  return ok
}

// ---------- Company members ----------

export async function getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
  const { ok, data } = await api<{ members: CompanyMember[] }>(`/api/companies/${companyId}/members`)
  return ok && data ? data.members : []
}

export async function addCompanyMember(
  companyId: string,
  email: string,
  name: string,
  role: CompanyMember["role"] = "member",
): Promise<CompanyMember | null> {
  const { ok, data } = await api<{ member: CompanyMember }>(`/api/companies/${companyId}/members`, {
    method: "POST",
    body: JSON.stringify({ email, name, role }),
  })
  return ok && data ? data.member : null
}

export async function removeCompanyMember(companyId: string, memberId: string): Promise<boolean> {
  const { ok } = await api(`/api/companies/${companyId}/members/${memberId}`, { method: "DELETE" })
  return ok
}

export async function updateCompanyMember(
  companyId: string,
  memberId: string,
  updates: Partial<CompanyMember>,
): Promise<boolean> {
  const { ok } = await api(`/api/companies/${companyId}/members/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  })
  return ok
}

// ---------- Notifications ----------

export async function getNotifications(): Promise<Notification[]> {
  const { ok, data } = await api<{ notifications: Notification[] }>("/api/notifications")
  return ok && data ? data.notifications : []
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { ok } = await api(`/api/notifications/${notificationId}`, {
    method: "PATCH",
    body: JSON.stringify({ read: true }),
  })
  return ok
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  const { ok } = await api("/api/notifications/mark-all-read", { method: "POST" })
  return ok
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const { ok } = await api(`/api/notifications/${notificationId}`, { method: "DELETE" })
  return ok
}

export async function getUnreadNotificationCount(): Promise<number> {
  const notifications = await getNotifications()
  return notifications.filter((n) => !n.read).length
}

// ---------- Share links ----------

export async function createShareLink(data: {
  userId: string
  companyId: string
  month: number
  year: number
  platform?: Platform
  privileges: SharePrivilege[]
  recipientEmail?: string
  recipientName?: string
  expiresAt?: string
}): Promise<ShareLink | null> {
  const { ok, data: res } = await api<{ shareLink: ShareLink }>("/api/share-links", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return ok && res ? res.shareLink : null
}

export async function getShareLinkById(shareId: string): Promise<ShareLink | null> {
  const { ok, data } = await api<{ shareLink: ShareLink }>(`/api/share-links/${shareId}`)
  return ok && data ? data.shareLink : null
}
