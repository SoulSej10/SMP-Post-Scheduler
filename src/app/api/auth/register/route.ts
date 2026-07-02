import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { setSessionCookie } from "@/lib/auth/session"
import { toSafeUser } from "@/lib/api/safe-user"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body?.password === "string" ? body.password : ""
  const name = typeof body?.name === "string" ? body.name.trim() : ""

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const [user] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      email,
      name,
      passwordHash,
      onboardingCompleted: false,
    })
    .returning()

  await setSessionCookie({ userId: user.id, email: user.email, name: user.name })

  return NextResponse.json({ user: toSafeUser(user) }, { status: 201 })
}
