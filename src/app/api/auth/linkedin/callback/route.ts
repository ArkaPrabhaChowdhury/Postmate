import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeLinkedInCode, getLinkedInProfile } from "@/lib/linkedin";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/settings?linkedin=error", req.url));
  }

  const storedState = req.cookies.get("linkedin_oauth_state")?.value;
  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/settings?linkedin=error", req.url));
  }

  try {
    const tokens = await exchangeLinkedInCode(code);
    const profile = await getLinkedInProfile(tokens.access_token);

    const userId = (session.user as { id: string }).id;
    const expiresAt = tokens.expires_in
      ? Math.floor(Date.now() / 1000) + tokens.expires_in
      : null;

    await prisma.account.upsert({
      where: { provider_providerAccountId: { provider: "linkedin", providerAccountId: profile.sub } },
      create: {
        userId,
        type: "oauth",
        provider: "linkedin",
        providerAccountId: profile.sub,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
        scope: "r_liteprofile w_member_social",
      },
      update: {
        userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
      },
    });

    const res = NextResponse.redirect(new URL("/settings?linkedin=connected", req.url));
    res.cookies.delete("linkedin_oauth_state");
    return res;
  } catch (err) {
    console.error("[linkedin/callback]", err);
    return NextResponse.redirect(new URL("/settings?linkedin=error", req.url));
  }
}
