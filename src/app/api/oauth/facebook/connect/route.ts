import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createOAuthState } from "@/lib/auth/oauth-state"
import { userHasCompanyAccess } from "@/lib/api/authorize"
import { isFacebookConfigured, getFacebookAuthUrl } from "@/lib/publishing/facebook"
import { getAppUrl } from "@/lib/api/app-url"

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get("companyId")
  if (!companyId || !(await userHasCompanyAccess(companyId, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!isFacebookConfigured()) {
    const url = new URL("/settings", getAppUrl())
    url.searchParams.set("connectError", "Facebook isn't configured yet - set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.")
    return NextResponse.redirect(url)
  }

  const state = await createOAuthState(companyId)
  const redirectUri = `${getAppUrl()}/api/oauth/facebook/callback`
  return NextResponse.redirect(getFacebookAuthUrl(redirectUri, state))
}
