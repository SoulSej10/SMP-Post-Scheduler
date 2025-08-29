import type { Post, User } from "./types"

const USERS_KEY = "smp:users"
const SESSION_KEY = "smp:session"
const SETTINGS_KEY = "smp:settings"

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
  }
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]))
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id, email, name, onboardingCompleted: false }))
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
    }),
  )
  return true
}

export function getSessionUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Pick<User, "id" | "email" | "name"> & { onboardingCompleted?: boolean }) : null
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

export function getPostsForUser(userId: string): Post[] {
  try {
    const raw = localStorage.getItem(`smp:posts:${userId}`)
    return raw ? (JSON.parse(raw) as Post[]) : []
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
