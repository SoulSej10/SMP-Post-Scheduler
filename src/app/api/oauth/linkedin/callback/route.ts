import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { platformSettings } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { verifyOAuthState } from "@/lib/auth/oauth-state"
import { exchangeCodeForToken, getLinkedInProfile } from "@/lib/publishing/linkedin"
import { getAppUrl } from "@/lib/api/app-url"

export async function GET(req: Request) {
  const settingsUrl = new URL("/settings", getAppUrl())

  const session = await getSession()
  if (!session) return NextResponse.redirect(new URL("/auth/login", getAppUrl()))

  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = await verifyOAuthState(searchParams.get("state"))

  if (!code || !state) {
    settingsUrl.searchParams.set("connectError", "LinkedIn connection failed - invalid or expired request.")
    return NextResponse.redirect(settingsUrl)
  }

  try {
    const redirectUri = `${getAppUrl()}/api/oauth/linkedin/callback`
    const { accessToken, expiresIn } = await exchangeCodeForToken(code, redirectUri)
    const profile = await getLinkedInProfile(accessToken)
    const personUrn = `urn:li:person:${profile.sub}`

    const [existing] = await db
      .select()
      .from(platformSettings)
      .where(and(eq(platformSettings.companyId, state.companyId), eq(platformSettings.platform, "linkedin")))

    const values = {
      connected: true,
      username: profile.name,
      externalAccountId: personUrn,
      accessToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      lastSync: new Date(),
      connectedByUserId: session.userId,
    }

    if (existing) {
      await db.update(platformSettings).set(values).where(eq(platformSettings.id, existing.id))
    } else {
      await db.insert(platformSettings).values({
        id: randomUUID(),
        companyId: state.companyId,
        platform: "linkedin",
        scheduleDays: [],
        ...values,
      })
    }

    settingsUrl.searchParams.set("connected", "linkedin")
    return NextResponse.redirect(settingsUrl)
  } catch (e: any) {
    settingsUrl.searchParams.set("connectError", e?.message || "LinkedIn connection failed.")
    return NextResponse.redirect(settingsUrl)
  }
}
