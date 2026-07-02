import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { companies, users } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { userHasCompanyAccess } from "@/lib/api/authorize"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  if (!(await userHasCompanyAccess(id, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [company] = await db.select().from(companies).where(eq(companies.id, id))
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

  return NextResponse.json({ company })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const [company] = await db.select().from(companies).where(eq(companies.id, id))
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })
  if (company.ownerId !== session.userId) {
    return NextResponse.json({ error: "Only the owner can edit this company" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const updates: Record<string, unknown> = {}
  if (typeof body?.name === "string" && body.name.trim()) updates.name = body.name.trim()
  if (typeof body?.description === "string") updates.description = body.description.trim()
  if (typeof body?.logo === "string") updates.logo = body.logo

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const [updated] = await db.update(companies).set(updates).where(eq(companies.id, id)).returning()

  return NextResponse.json({ company: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const [company] = await db.select().from(companies).where(eq(companies.id, id))
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })
  if (company.ownerId !== session.userId) {
    return NextResponse.json({ error: "Only the owner can delete this company" }, { status: 403 })
  }

  // Cascades to posts, company_members, platform_settings, notifications, share_links
  await db.delete(companies).where(eq(companies.id, id))

  // Any user pointing at this company as "current" needs to fall back - the client
  // auto-selects another available company when currentCompanyId resolves to null.
  await db.update(users).set({ currentCompanyId: null }).where(eq(users.currentCompanyId, id))

  return NextResponse.json({ ok: true })
}
