import { prisma } from "@/lib/prisma";

const LINKEDIN_API = "https://api.linkedin.com/v2";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

export interface LinkedInTokens {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}

export async function getLinkedInAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
    // Use LinkedIn v2 scopes by default. OIDC scopes like "openid" require enabling the
    // "Sign In with LinkedIn using OpenID Connect" product on your LinkedIn app.
    scope: "r_liteprofile w_member_social",
    state,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

export async function exchangeLinkedInCode(code: string): Promise<LinkedInTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${err}`);
  }
  return res.json();
}

export async function getLinkedInProfile(accessToken: string): Promise<{ sub: string; name: string }> {
  const res = await fetch(`${LINKEDIN_API}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch LinkedIn profile");
  const data = (await res.json()) as {
    id?: string;
    localizedFirstName?: string;
    localizedLastName?: string;
  };
  const name = [data.localizedFirstName, data.localizedLastName].filter(Boolean).join(" ").trim();
  return { sub: data.id ?? "", name: name || "LinkedIn user" };
}

export async function getLinkedInAccount(userId: string) {
  return prisma.account.findFirst({
    where: { userId, provider: "linkedin" },
    select: { access_token: true, expires_at: true, providerAccountId: true },
  });
}

export async function postToLinkedIn(userId: string, content: string): Promise<string> {
  const account = await getLinkedInAccount(userId);
  if (!account?.access_token) throw new Error("LinkedIn not connected");

  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    throw new Error("LinkedIn token expired — please reconnect");
  }

  const personUrn = `urn:li:person:${account.providerAccountId}`;

  const body = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: content },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const res = await fetch(`${LINKEDIN_API}/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn post failed: ${err}`);
  }

  const data = await res.json();
  return data.id as string;
}
