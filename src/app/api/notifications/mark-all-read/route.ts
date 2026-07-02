import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, session.userId))

  return NextResponse.json({ ok: true })
}
