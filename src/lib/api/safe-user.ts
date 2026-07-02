import type { users } from "@/lib/db/schema"

type UserRow = typeof users.$inferSelect

export function toSafeUser(user: UserRow) {
  const { passwordHash, ...safe } = user
  return safe
}
