import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { companyMembers } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { userHasCompanyAccess } from "@/lib/api/authorize"
import { createNotification } from "@/lib/db/notify"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  if (!(await userHasCompanyAccess(id, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const members = await db.select().from(companyMembers).where(eq(companyMembers.companyId, id))
  return NextResponse.json({ members })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  if (!(await userHasCompanyAccess(id, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email.trim() : ""
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  const role = typeof body?.role === "string" ? body.role : "member"

  if (!email || !name) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
  }

  const [member] = await db
    .insert(companyMembers)
    .values({ id: randomUUID(), companyId: id, email, name, role: role as any, status: "pending" })
    .returning()

  await createNotification(
    session.userId,
    "member",
    "Member invited",
    `${name} (${email}) has been invited to join the company.`,
    id,
    { memberId: member.id, email, name, role },
  )

  return NextResponse.json({ member }, { status: 201 })
}
