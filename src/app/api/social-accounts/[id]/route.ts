import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { platformSettings } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { userHasCompanyAccess } from "@/lib/api/authorize"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const [existing] = await db.select().from(platformSettings).where(eq(platformSettings.id, id))
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!(await userHasCompanyAccess(existing.companyId, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await db
    .update(platformSettings)
    .set({
      connected: false,
      username: null,
      externalAccountId: null,
      accessToken: null,
      tokenExpiresAt: null,
      lastSync: null,
    })
    .where(eq(platformSettings.id, id))

  return NextResponse.json({ ok: true })
}
