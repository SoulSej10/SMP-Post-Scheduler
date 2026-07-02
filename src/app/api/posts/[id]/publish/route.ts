import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { posts, platformSettings } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { userHasCompanyAccess } from "@/lib/api/authorize"
import { createNotification } from "@/lib/db/notify"
import { publishToFacebookPage, publishToInstagram } from "@/lib/publishing/facebook"
import { publishToLinkedIn } from "@/lib/publishing/linkedin"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const [post] = await db.select().from(posts).where(eq(posts.id, id))
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })
  if (!(await userHasCompanyAccess(post.companyId, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [account] = await db
    .select()
    .from(platformSettings)
    .where(and(eq(platformSettings.companyId, post.companyId), eq(platformSettings.platform, post.platform)))

  if (!account || !account.connected || !account.accessToken || !account.externalAccountId) {
    return NextResponse.json(
      { error: `No connected ${post.platform} account for this company. Connect one in Settings first.` },
      { status: 400 },
    )
  }

  try {
    if (post.platform === "facebook") {
      await publishToFacebookPage(account.externalAccountId, account.accessToken, post.content, post.imageUrl)
    } else if (post.platform === "instagram") {
      await publishToInstagram(account.externalAccountId, account.accessToken, post.content, post.imageUrl)
    } else if (post.platform === "linkedin") {
      await publishToLinkedIn(account.externalAccountId, account.accessToken, post.content)
    }

    const [updated] = await db.update(posts).set({ status: "posted" }).where(eq(posts.id, id)).returning()

    await createNotification(
      session.userId,
      "success",
      "Post published",
      `Your ${post.platform} post was published successfully.`,
      post.companyId,
      { postId: id, platform: post.platform },
    )

    return NextResponse.json({ post: updated })
  } catch (e: any) {
    await db.update(posts).set({ status: "failed" }).where(eq(posts.id, id))

    await createNotification(
      session.userId,
      "error",
      "Publish failed",
      e?.message || `Failed to publish your ${post.platform} post.`,
      post.companyId,
      { postId: id, platform: post.platform },
    )

    return NextResponse.json({ error: e?.message || "Publish failed" }, { status: 502 })
  }
}
