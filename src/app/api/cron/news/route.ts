import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { runNewsIngestForUser } from "@/lib/news-ingest";
import { sendNewsDigestEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Increase on Vercel Pro: export const maxDuration = 300;
export const maxDuration = 60;

function nowIso() {
  return new Date().toISOString();
}

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

async function ensureDbConnected() {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$connect();
      return;
    } catch (err) {
      lastError = err;
      // Backoff: 250ms, 500ms, 1000ms
      const delayMs = 250 * 2 ** (attempt - 1);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  throw lastError;
}

async function run(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = randomUUID();
  const timeBudgetMs = Math.max(
    5_000,
    Number(process.env.CRON_TIME_BUDGET_MS ?? 55_000),
  );

  console.log(
    `[cron/news] start id=${requestId} at=${nowIso()} budgetMs=${timeBudgetMs} method=${req.method} url=${req.url}`,
  );

  if (!isAuthorizedCronRequest(req)) {
    console.warn(`[cron/news] unauthorized id=${requestId} at=${nowIso()}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDbConnected();
  } catch (err) {
    console.error(`[cron/news] db connect failed id=${requestId} at=${nowIso()}:`, err);
    return NextResponse.json(
      { ok: false, error: "DB connect failed", requestId },
      { status: 503 },
    );
  }

  let usersToProcess: Array<{
    userId: string;
    newsEmailEnabled: boolean;
    user: { email: string | null; name: string | null };
  }> = [];

  try {
    usersToProcess = await prisma.userSettings.findMany({
      where: { newsAutoFetch: true },
      select: {
        userId: true,
        newsEmailEnabled: true,
        user: { select: { email: true, name: true } },
      },
    });
  } catch (err) {
    console.error(`[cron/news] query users failed id=${requestId} at=${nowIso()}:`, err);
    return NextResponse.json(
      { ok: false, error: "Failed to query users", requestId },
      { status: 500 },
    );
  }

  const results: Array<{ userId: string; added: number; emailed: boolean; ok: boolean; error?: string }> = [];
  const skippedUserIds: string[] = [];

  for (const setting of usersToProcess) {
    const elapsedMs = Date.now() - startedAt;
    if (elapsedMs > timeBudgetMs) {
      console.warn(
        `[cron/news] budget exceeded id=${requestId} at=${nowIso()} elapsedMs=${elapsedMs} processed=${results.length} remaining=${usersToProcess.length - results.length}`,
      );
      skippedUserIds.push(
        ...usersToProcess.slice(results.length).map((s) => s.userId),
      );
      break;
    }

    try {
      console.log(
        `[cron/news] processing id=${requestId} userId=${setting.userId} emailEnabled=${setting.newsEmailEnabled} email=${setting.user.email}`,
      );
      const result = await runNewsIngestForUser(setting.userId);
      console.log(`[cron/news] ingest done id=${requestId} userId=${setting.userId} added=${result.added}`);
      let emailed = false;

      if (result.added > 0 && setting.newsEmailEnabled && setting.user.email) {
        console.log(`[cron/news] sending email id=${requestId} userId=${setting.userId} to=${setting.user.email}`);
        await sendNewsDigestEmail({
          to: setting.user.email,
          name: setting.user.name,
          articles: result.articles,
        });
        emailed = true;
      } else {
        console.log(
          `[cron/news] skip email id=${requestId} userId=${setting.userId} added=${result.added} enabled=${setting.newsEmailEnabled} hasEmail=${!!setting.user.email}`,
        );
      }

      results.push({ userId: setting.userId, added: result.added, emailed, ok: true });
    } catch (err) {
      console.error(`[cron/news] error id=${requestId} userId=${setting.userId}:`, err);
      results.push({ userId: setting.userId, added: 0, emailed: false, ok: false, error: String(err) });
    }
  }

  const elapsedMs = Date.now() - startedAt;
  console.log(
    `[cron/news] done id=${requestId} at=${nowIso()} processed=${results.length} skipped=${skippedUserIds.length} elapsedMs=${elapsedMs}`,
  );

  // Always return 200 for cron providers if we did at least some work; partial runs are expected under serverless limits.
  return NextResponse.json({
    ok: true,
    requestId,
    processed: results.length,
    skipped: skippedUserIds.length,
    skippedUserIds,
    elapsedMs,
    results,
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
