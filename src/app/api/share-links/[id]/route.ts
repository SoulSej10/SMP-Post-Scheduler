import { NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { shareLinks } from "@/lib/db/schema"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [link] = await db.select().from(shareLinks).where(eq(shareLinks.id, id))
  if (!link) return NextResponse.json({ error: "Share link not found" }, { status: 404 })

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Share link has expired" }, { status: 410 })
  }

  await db
    .update(shareLinks)
    .set({ accessCount: sql`${shareLinks.accessCount} + 1`, lastAccessedAt: new Date() })
    .where(eq(shareLinks.id, id))

  return NextResponse.json({ shareLink: link })
}
