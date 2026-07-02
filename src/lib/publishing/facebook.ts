const GRAPH_VERSION = "v21.0"
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`

export function isFacebookConfigured() {
  return Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET)
}

export function getFacebookAuthUrl(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: redirectUri,
    state,
    scope: [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
      "business_management",
    ].join(","),
  })
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`
}

async function graphGet(path: string, params: Record<string, string>) {
  const url = `${GRAPH_BASE}${path}?${new URLSearchParams(params).toString()}`
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || "Facebook Graph API request failed")
  return data
}

async function graphPost(path: string, params: Record<string, string>) {
  const url = `${GRAPH_BASE}${path}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || "Facebook Graph API request failed")
  return data
}

export async function exchangeCodeForUserToken(code: string, redirectUri: string) {
  const data = await graphGet("/oauth/access_token", {
    client_id: process.env.FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  })
  return data.access_token as string
}

export async function exchangeForLongLivedToken(shortLivedToken: string) {
  const data = await graphGet("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: process.env.FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    fb_exchange_token: shortLivedToken,
  })
  return data.access_token as string
}

export type FacebookConnectedAccount = {
  platform: "facebook" | "instagram"
  externalAccountId: string
  username: string
  accessToken: string
}

export async function discoverPagesAndInstagramAccounts(userAccessToken: string): Promise<FacebookConnectedAccount[]> {
  const pagesData = await graphGet("/me/accounts", { access_token: userAccessToken, fields: "id,name,access_token" })
  const pages: Array<{ id: string; name: string; access_token: string }> = pagesData.data || []

  const accounts: FacebookConnectedAccount[] = []

  for (const page of pages) {
    accounts.push({
      platform: "facebook",
      externalAccountId: page.id,
      username: page.name,
      accessToken: page.access_token,
    })

    try {
      const igData = await graphGet(`/${page.id}`, {
        fields: "instagram_business_account{id,username}",
        access_token: page.access_token,
      })
      const igAccount = igData.instagram_business_account
      if (igAccount?.id) {
        accounts.push({
          platform: "instagram",
          externalAccountId: igAccount.id,
          username: igAccount.username ? `@${igAccount.username}` : igAccount.id,
          accessToken: page.access_token,
        })
      }
    } catch {
      // Page has no linked Instagram business account - skip
    }
  }

  return accounts
}

export async function publishToFacebookPage(pageId: string, pageAccessToken: string, content: string, imageUrl?: string | null) {
  if (imageUrl) {
    const data = await graphPost(`/${pageId}/photos`, {
      url: imageUrl,
      caption: content,
      access_token: pageAccessToken,
    })
    return { externalPostId: data.post_id || data.id }
  }

  const data = await graphPost(`/${pageId}/feed`, {
    message: content,
    access_token: pageAccessToken,
  })
  return { externalPostId: data.id }
}

export async function publishToInstagram(igUserId: string, pageAccessToken: string, content: string, imageUrl?: string | null) {
  if (!imageUrl) {
    throw new Error("Instagram requires an image - text-only posts are not supported")
  }

  const container = await graphPost(`/${igUserId}/media`, {
    image_url: imageUrl,
    caption: content,
    access_token: pageAccessToken,
  })

  const published = await graphPost(`/${igUserId}/media_publish`, {
    creation_id: container.id,
    access_token: pageAccessToken,
  })

  return { externalPostId: published.id }
}
