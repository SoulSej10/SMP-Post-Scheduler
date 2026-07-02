import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { companies, companyMembers } from "@/lib/db/schema"

export async function userHasCompanyAccess(companyId: string, userId: string): Promise<boolean> {
  const [company] = await db.select().from(companies).where(eq(companies.id, companyId))
  if (!company) return false
  if (company.ownerId === userId) return true

  const [membership] = await db
    .select()
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)))

  return Boolean(membership)
}
