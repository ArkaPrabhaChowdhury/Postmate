import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runNewsIngestForUser } from "@/lib/news-ingest";
import { sendNewsDigestEmail } from "@/lib/email";

// Increase on Vercel Pro: export const maxDuration = 300;
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const usersToProcess = await prisma.userSettings.findMany({
    where: { newsAutoFetch: true },
    select: {
      userId: true,
      newsEmailEnabled: true,
      user: { select: { email: true, name: true } },
    },
  });

  const results: Array<{ userId: string; added: number; emailed: boolean; ok: boolean; error?: string }> = [];

  for (const setting of usersToProcess) {
    try {
      console.log(`[cron] processing userId=${setting.userId} emailEnabled=${setting.newsEmailEnabled} email=${setting.user.email}`);
      const result = await runNewsIngestForUser(setting.userId);
      console.log(`[cron] ingest done added=${result.added}`);
      let emailed = false;

      if (result.added > 0 && setting.newsEmailEnabled && setting.user.email) {
        console.log(`[cron] sending email to ${setting.user.email}`);
        await sendNewsDigestEmail({
          to: setting.user.email,
          name: setting.user.name,
          articles: result.articles,
        });
        emailed = true;
      } else {
        console.log(`[cron] skip email: added=${result.added} enabled=${setting.newsEmailEnabled} hasEmail=${!!setting.user.email}`);
      }

      results.push({ userId: setting.userId, added: result.added, emailed, ok: true });
    } catch (err) {
      console.error(`[cron] error for userId=${setting.userId}:`, err);
      results.push({ userId: setting.userId, added: 0, emailed: false, ok: false, error: String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
