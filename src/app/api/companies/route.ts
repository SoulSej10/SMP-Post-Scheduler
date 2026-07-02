import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { eq, inArray, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { companies, companyMembers, users } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const memberRows = await db
    .select({ companyId: companyMembers.companyId })
    .from(companyMembers)
    .where(eq(companyMembers.userId, session.userId))

  const memberCompanyIds = memberRows.map((r) => r.companyId)

  const rows = await db
    .select()
    .from(companies)
    .where(
      memberCompanyIds.length > 0
        ? or(eq(companies.ownerId, session.userId), inArray(companies.id, memberCompanyIds))
        : eq(companies.ownerId, session.userId),
    )

  return NextResponse.json({ companies: rows })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  const description = typeof body?.description === "string" ? body.description.trim() : ""
  const logo = typeof body?.logo === "string" && body.logo ? body.logo : null

  if (!name) return NextResponse.json({ error: "Company name is required" }, { status: 400 })

  const [company] = await db
    .insert(companies)
    .values({ id: randomUUID(), name, description, logo, ownerId: session.userId })
    .returning()

  await db.insert(companyMembers).values({
    id: randomUUID(),
    companyId: company.id,
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: "owner",
    status: "active",
    joinedAt: new Date(),
  })

  await db.update(users).set({ currentCompanyId: company.id }).where(eq(users.id, session.userId))

  return NextResponse.json({ company }, { status: 201 })
}
