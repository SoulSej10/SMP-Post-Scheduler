import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { shareLinks } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { userHasCompanyAccess } from "@/lib/api/authorize"
import { createNotification } from "@/lib/db/notify"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const companyId = typeof body?.companyId === "string" ? body.companyId : ""
  if (!companyId || !(await userHasCompanyAccess(companyId, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [link] = await db
    .insert(shareLinks)
    .values({
      id: randomUUID(),
      userId: session.userId,
      companyId,
      month: body.month,
      year: body.year,
      platform: body.platform ?? null,
      privileges: Array.isArray(body.privileges) ? body.privileges : [],
      recipientEmail: body.recipientEmail ?? null,
      recipientName: body.recipientName ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    })
    .returning()

  const recipient = body.recipientName || body.recipientEmail || "recipient"
  const privileges = Array.isArray(body.privileges) ? body.privileges.join(", ") : ""
  await createNotification(
    session.userId,
    "share",
    "Content shared",
    `Monthly overview shared with ${recipient}${privileges ? ` with ${privileges} privileges` : ""}.`,
    companyId,
    { shareId: link.id, recipient, privileges: body.privileges },
  )

  return NextResponse.json({ shareLink: link }, { status: 201 })
}
