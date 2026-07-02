import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { toSafeUser } from "@/lib/api/safe-user"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) })
  if (!user) return NextResponse.json({ user: null }, { status: 401 })

  return NextResponse.json({ user: toSafeUser(user) })
}
