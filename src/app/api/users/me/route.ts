import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { toSafeUser } from "@/lib/api/safe-user"

const ALLOWED_FIELDS = [
  "name",
  "phone",
  "role",
  "bio",
  "profilePicture",
  "onboardingCompleted",
  "currentCompanyId",
  "preferences",
] as const

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const [user] = await db.update(users).set(updates).where(eq(users.id, session.userId)).returning()
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  return NextResponse.json({ user: toSafeUser(user) })
}
