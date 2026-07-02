import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { platformSettings } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { verifyOAuthState } from "@/lib/auth/oauth-state"
import { exchangeCodeForUserToken, exchangeForLongLivedToken, discoverPagesAndInstagramAccounts } from "@/lib/publishing/facebook"
import { getAppUrl } from "@/lib/api/app-url"

export async function GET(req: Request) {
  const settingsUrl = new URL("/settings", getAppUrl())

  const session = await getSession()
  if (!session) return NextResponse.redirect(new URL("/auth/login", getAppUrl()))

  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = await verifyOAuthState(searchParams.get("state"))

  if (!code || !state) {
    settingsUrl.searchParams.set("connectError", "Facebook connection failed - invalid or expired request.")
    return NextResponse.redirect(settingsUrl)
  }

  try {
    const redirectUri = `${getAppUrl()}/api/oauth/facebook/callback`
    const shortLivedToken = await exchangeCodeForUserToken(code, redirectUri)
    const longLivedToken = await exchangeForLongLivedToken(shortLivedToken)
    const accounts = await discoverPagesAndInstagramAccounts(longLivedToken)

    if (accounts.length === 0) {
      settingsUrl.searchParams.set("connectError", "No Facebook Pages found for this account.")
      return NextResponse.redirect(settingsUrl)
    }

    // One connection per platform per company - use the first page (and its linked IG account) found
    const seenPlatforms = new Set<string>()
    for (const account of accounts) {
      if (seenPlatforms.has(account.platform)) continue
      seenPlatforms.add(account.platform)

      const [existing] = await db
        .select()
        .from(platformSettings)
        .where(and(eq(platformSettings.companyId, state.companyId), eq(platformSettings.platform, account.platform)))

      const values = {
        connected: true,
        username: account.username,
        externalAccountId: account.externalAccountId,
        accessToken: account.accessToken,
        lastSync: new Date(),
        connectedByUserId: session.userId,
      }

      if (existing) {
        await db.update(platformSettings).set(values).where(eq(platformSettings.id, existing.id))
      } else {
        await db.insert(platformSettings).values({
          id: randomUUID(),
          companyId: state.companyId,
          platform: account.platform,
          scheduleDays: [],
          ...values,
        })
      }
    }

    settingsUrl.searchParams.set("connected", seenPlatforms.size > 1 ? "facebook,instagram" : "facebook")
    return NextResponse.redirect(settingsUrl)
  } catch (e: any) {
    settingsUrl.searchParams.set("connectError", e?.message || "Facebook connection failed.")
    return NextResponse.redirect(settingsUrl)
  }
}
