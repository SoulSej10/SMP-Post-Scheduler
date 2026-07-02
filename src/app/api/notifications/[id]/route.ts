import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)

  const [notification] = await db
    .update(notifications)
    .set({ read: body?.read ?? true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, session.userId)))
    .returning()

  if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 })

  return NextResponse.json({ notification })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const [notification] = await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, session.userId)))
    .returning()

  if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 })

  return NextResponse.json({ ok: true })
}
