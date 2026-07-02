import { randomUUID } from "crypto"
import { db } from "./index"
import { notifications } from "./schema"

type NotificationType = "success" | "warning" | "error" | "info" | "share" | "member" | "schedule"

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message?: string,
  companyId?: string | null,
  data?: unknown,
) {
  const [row] = await db
    .insert(notifications)
    .values({
      id: randomUUID(),
      userId,
      companyId: companyId ?? null,
      type,
      title,
      message,
      data: data ?? null,
    })
    .returning()
  return row
}
