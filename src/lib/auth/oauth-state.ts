import { randomBytes } from "crypto"
import { cookies } from "next/headers"

const STATE_COOKIE = "gazetta_oauth_state"

export async function createOAuthState(companyId: string): Promise<string> {
  const nonce = randomBytes(16).toString("hex")
  const store = await cookies()
  store.set(STATE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  })
  return `${nonce}.${companyId}`
}

export async function verifyOAuthState(state: string | null): Promise<{ companyId: string } | null> {
  if (!state) return null
  const [nonce, companyId] = state.split(".")
  if (!nonce || !companyId) return null

  const store = await cookies()
  const expected = store.get(STATE_COOKIE)?.value
  store.delete(STATE_COOKIE)

  if (!expected || expected !== nonce) return null
  return { companyId }
}
