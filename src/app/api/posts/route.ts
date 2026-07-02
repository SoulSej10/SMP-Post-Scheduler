import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { and, eq, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { userHasCompanyAccess } from "@/lib/api/authorize"
import { createNotification } from "@/lib/db/notify"

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get("companyId")
  if (!companyId) return NextResponse.json({ error: "companyId is required" }, { status: 400 })

  if (!(await userHasCompanyAccess(companyId, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  await db
    .update(posts)
    .set({ status: "failed" })
    .where(and(eq(posts.companyId, companyId), eq(posts.status, "scheduled"), lt(posts.scheduledAt, oneDayAgo)))

  const rows = await db
    .select()
    .from(posts)
    .where(eq(posts.companyId, companyId))
    .orderBy(posts.scheduledAt)

  return NextResponse.json({ posts: rows })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const inputPosts = Array.isArray(body?.posts) ? body.posts : null
  if (!inputPosts || inputPosts.length === 0) {
    return NextResponse.json({ error: "posts array is required" }, { status: 400 })
  }

  const companyId = inputPosts[0]?.companyId
  if (!companyId || !(await userHasCompanyAccess(companyId, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const values = inputPosts.map((p: any) => ({
    id: randomUUID(),
    userId: session.userId,
    companyId,
    platform: p.platform,
    content: p.content,
    imageUrl: p.imageUrl ?? null,
    scheduledAt: new Date(p.scheduledAt),
    status: p.status ?? "scheduled",
    link: p.link ?? null,
  }))

  const created = await db.insert(posts).values(values).returning()

  return NextResponse.json({ posts: created }, { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : null
  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: "ids array is required" }, { status: 400 })
  }

  const targets = await db.select().from(posts).where(sql`${posts.id} = ANY(${ids})`)
  const companyIds = [...new Set(targets.map((p) => p.companyId))]
  for (const companyId of companyIds) {
    if (!(await userHasCompanyAccess(companyId, session.userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const deleted = await db.delete(posts).where(sql`${posts.id} = ANY(${ids})`).returning()

  if (deleted.length > 0) {
    await createNotification(
      session.userId,
      "warning",
      deleted.length === 1 ? "Post deleted" : "Posts deleted",
      deleted.length === 1
        ? `Your ${deleted[0].platform} post has been deleted.`
        : `Successfully deleted ${deleted.length} posts.`,
      companyIds[0],
      { deletedCount: deleted.length },
    )
  }

  return NextResponse.json({ deletedCount: deleted.length })
}
