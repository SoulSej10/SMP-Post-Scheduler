import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { platformSettings } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { userHasCompanyAccess } from "@/lib/api/authorize"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  if (!(await userHasCompanyAccess(id, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rows = await db.select().from(platformSettings).where(eq(platformSettings.companyId, id))

  // Never expose access tokens to the client
  const accounts = rows.map((r) => ({
    id: r.id,
    platform: r.platform,
    connected: r.connected,
    username: r.username,
    lastSync: r.lastSync,
    scheduleDays: r.scheduleDays,
  }))

  return NextResponse.json({ accounts })
}
