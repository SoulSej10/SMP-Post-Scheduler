import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { companyMembers } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { userHasCompanyAccess } from "@/lib/api/authorize"
import { createNotification } from "@/lib/db/notify"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, memberId } = await params
  if (!(await userHasCompanyAccess(id, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const updates: Record<string, unknown> = {}
  if (typeof body?.role === "string") updates.role = body.role
  if (typeof body?.status === "string") updates.status = body.status

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const [member] = await db
    .update(companyMembers)
    .set(updates)
    .where(and(eq(companyMembers.id, memberId), eq(companyMembers.companyId, id)))
    .returning()

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  if (updates.role) {
    await createNotification(
      session.userId,
      "member",
      "Member role updated",
      `${member.name}'s role has been updated to ${updates.role}.`,
      id,
      { memberId, newRole: updates.role },
    )
  }

  return NextResponse.json({ member })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, memberId } = await params
  if (!(await userHasCompanyAccess(id, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [member] = await db
    .delete(companyMembers)
    .where(and(eq(companyMembers.id, memberId), eq(companyMembers.companyId, id)))
    .returning()

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  await createNotification(
    session.userId,
    "member",
    "Member removed",
    `${member.name} has been removed from the company.`,
    id,
    { memberId },
  )

  return NextResponse.json({ ok: true })
}
