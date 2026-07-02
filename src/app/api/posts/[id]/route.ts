import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { userHasCompanyAccess } from "@/lib/api/authorize"
import { createNotification } from "@/lib/db/notify"

const EDITABLE_FIELDS = ["content", "imageUrl", "scheduledAt", "status", "link", "feedback", "boosted", "approvalStatus"]

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const [existing] = await db.select().from(posts).where(eq(posts.id, id))
  if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 })
  if (!(await userHasCompanyAccess(existing.companyId, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const updates: Record<string, unknown> = {}
  for (const field of EDITABLE_FIELDS) {
    if (body && field in body) {
      updates[field] = field === "scheduledAt" ? new Date(body[field]) : body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const [post] = await db.update(posts).set(updates).where(eq(posts.id, id)).returning()

  await createNotification(
    session.userId,
    "info",
    "Post updated",
    `Your ${post.platform} post has been updated successfully.`,
    post.companyId,
    { postId: post.id, platform: post.platform },
  )

  return NextResponse.json({ post })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const [existing] = await db.select().from(posts).where(eq(posts.id, id))
  if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 })
  if (!(await userHasCompanyAccess(existing.companyId, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await db.delete(posts).where(eq(posts.id, id))

  await createNotification(
    session.userId,
    "warning",
    "Post deleted",
    `Your ${existing.platform} post has been deleted.`,
    existing.companyId,
    { postId: id, platform: existing.platform },
  )

  return NextResponse.json({ ok: true })
}
