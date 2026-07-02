const API_BASE = "https://api.linkedin.com"

export function isLinkedInConfigured() {
  return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET)
}

export function getLinkedInAuthUrl(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile w_member_social",
  })
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }).toString(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error_description || "LinkedIn token exchange failed")
  return { accessToken: data.access_token as string, expiresIn: data.expires_in as number }
}

export async function getLinkedInProfile(accessToken: string) {
  const res = await fetch(`${API_BASE}/v2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || "Failed to fetch LinkedIn profile")
  return { sub: data.sub as string, name: data.name as string }
}

export async function publishToLinkedIn(personUrn: string, accessToken: string, content: string) {
  const res = await fetch(`${API_BASE}/v2/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: personUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message || "LinkedIn publish failed")
  return { externalPostId: res.headers.get("x-restli-id") || data?.id || "unknown" }
}
