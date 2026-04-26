import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWeeklyShippingDigestEmail } from "@/lib/email";
import { getWeeklyShippingDigest } from "@/lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorizedCronRequest(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const headerSecret = req.headers.get("x-cron-secret");
  if (headerSecret === secret) return true;

  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret === secret) return true;

  return false;
}

async function run(req: NextRequest) {
  const requestId = randomUUID();
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeRepos = await prisma.repo.findMany({
    where: { isActive: true },
    select: {
      id: true,
      fullName: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  const results: Array<{ userId: string; repoId: string; totalCommits: number; worthPostingCount: number; emailed: boolean; ok: boolean; error?: string }> = [];

  for (const repo of activeRepos) {
    try {
      if (!repo.user.email) {
        results.push({
          userId: repo.user.id,
          repoId: repo.id,
          totalCommits: 0,
          worthPostingCount: 0,
          emailed: false,
          ok: true,
        });
        continue;
      }

      const digest = await getWeeklyShippingDigest(repo.user.id, repo.id);
      if (digest.totalCommits === 0) {
        results.push({
          userId: repo.user.id,
          repoId: repo.id,
          totalCommits: 0,
          worthPostingCount: 0,
          emailed: false,
          ok: true,
        });
        continue;
      }

      await sendWeeklyShippingDigestEmail({
        to: repo.user.email,
        name: repo.user.name,
        repoFullName: repo.fullName,
        totalCommits: digest.totalCommits,
        worthPosting: digest.worthPosting,
      });

      results.push({
        userId: repo.user.id,
        repoId: repo.id,
        totalCommits: digest.totalCommits,
        worthPostingCount: digest.worthPostingCount,
        emailed: true,
        ok: true,
      });
    } catch (err) {
      results.push({
        userId: repo.user.id,
        repoId: repo.id,
        totalCommits: 0,
        worthPostingCount: 0,
        emailed: false,
        ok: false,
        error: String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    requestId,
    processed: results.length,
    results,
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
