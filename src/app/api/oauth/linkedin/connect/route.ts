import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createOAuthState } from "@/lib/auth/oauth-state"
import { userHasCompanyAccess } from "@/lib/api/authorize"
import { isLinkedInConfigured, getLinkedInAuthUrl } from "@/lib/publishing/linkedin"
import { getAppUrl } from "@/lib/api/app-url"

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get("companyId")
  if (!companyId || !(await userHasCompanyAccess(companyId, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!isLinkedInConfigured()) {
    const url = new URL("/settings", getAppUrl())
    url.searchParams.set("connectError", "LinkedIn isn't configured yet - set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.")
    return NextResponse.redirect(url)
  }

  const state = await createOAuthState(companyId)
  const redirectUri = `${getAppUrl()}/api/oauth/linkedin/callback`
  return NextResponse.redirect(getLinkedInAuthUrl(redirectUri, state))
}
