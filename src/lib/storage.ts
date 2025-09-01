import type { Post, User, Company } from "./types"

const USERS_KEY = "smp:users"
const SESSION_KEY = "smp:session"
const SETTINGS_KEY = "smp:settings"
const COMPANIES_KEY = "smp:companies"

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
    currentCompanyId: null,
    bio: "",
    preferences: {
      emailNotifications: false,
      pushNotifications: false,
      weeklyReports: false
    }
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
    posts[index] = updatedPost
    savePosts(userId, posts)
    return true
  }
  return false
}

export function deletePost(userId: string, postId: string) {
  const posts = getPostsForUser(userId)
  const filtered = posts.filter((p) => p.id !== postId)
  savePosts(userId, filtered)
  return filtered.length < posts.length
}

export function deletePosts(userId: string, postIds: string[]) {
  const posts = getPostsForUser(userId)
  const filtered = posts.filter((p) => !postIds.includes(p.id))
  savePosts(userId, filtered)
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
