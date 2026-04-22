"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { assertProPlan } from "@/lib/plan-limits";
import { runNewsIngestForUser } from "@/lib/news-ingest";
import { sendNewsDigestEmail } from "@/lib/email";
import type { IngestArticle } from "@/lib/news-ingest";
import { generateNewsTweet } from "@/lib/ai";
import { postToLinkedIn } from "@/lib/linkedin";

export async function ingestNews() {
  const userId = await requireUserId();
  await assertProPlan(userId);
  const result = await runNewsIngestForUser(userId);

  if (result.added > 0) {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { newsEmailEnabled: true, user: { select: { email: true, name: true } } },
    });
    if (settings?.newsEmailEnabled && settings.user.email) {
      await sendNewsDigestEmail({
        to: settings.user.email,
        name: settings.user.name,
        articles: result.articles,
      }).catch(() => {});
    }
  }

  revalidatePath("/news");
  return result;
}

export async function getLastFetchTime(): Promise<Date | null> {
  const userId = await requireUserId();
  await assertProPlan(userId);
  const latest = await prisma.seenUrl.findFirst({
    where: { userId },
    orderBy: { seenAt: "desc" },
    select: { seenAt: true },
  });
  return latest?.seenAt ?? null;
}

export async function getPendingTweets() {
  const userId = await requireUserId();
  await assertProPlan(userId);
  return prisma.newsTweet.findMany({
    where: { userId, status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, articleUrl: true, articleTitle: true, tweet: true, createdAt: true, linkedinStatus: true, scheduledAt: true },
  });
}

export async function getLinkedInStatus(): Promise<boolean> {
  const userId = await requireUserId();
  const account = await prisma.account.findFirst({
    where: { userId, provider: "linkedin" },
    select: { access_token: true },
  });
  return !!account?.access_token;
}

export async function approveTweet(formData: FormData) {
  const userId = await requireUserId();
  await assertProPlan(userId);
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing tweet id.");

  await prisma.newsTweet.update({ where: { id, userId }, data: { status: "approved" } });

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { linkedinAutoPost: true },
  });

  if (settings?.linkedinAutoPost) {
    const tweet = await prisma.newsTweet.findFirst({ where: { id, userId }, select: { tweet: true } });
    if (tweet) {
      try {
        const linkedinPostId = await postToLinkedIn(userId, tweet.tweet);
        await prisma.newsTweet.update({
          where: { id },
          data: { linkedinStatus: "posted", linkedinPostId, status: "posted", postedAt: new Date() },
        });
      } catch {
        await prisma.newsTweet.update({ where: { id }, data: { linkedinStatus: "failed" } });
      }
    }
  }

  revalidatePath("/news");
}

export async function scheduleLinkedInTweet(id: string, scheduledAt: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  await assertProPlan(userId);

  const date = new Date(scheduledAt);
  if (isNaN(date.getTime()) || date <= new Date()) {
    return { ok: false, error: "Scheduled time must be in the future." };
  }

  await prisma.newsTweet.updateMany({
    where: { id, userId },
    data: { linkedinStatus: "scheduled", scheduledAt: date },
  });
  revalidatePath("/news");
  return { ok: true };
}

export async function postLinkedInTweetNow(id: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  await assertProPlan(userId);

  const tweet = await prisma.newsTweet.findFirst({ where: { id, userId }, select: { tweet: true } });
  if (!tweet) return { ok: false, error: "Tweet not found." };

  try {
    const linkedinPostId = await postToLinkedIn(userId, tweet.tweet);
    await prisma.newsTweet.update({
      where: { id },
      data: { linkedinStatus: "posted", linkedinPostId, status: "posted", postedAt: new Date() },
    });
    revalidatePath("/news");
    return { ok: true };
  } catch (err) {
    await prisma.newsTweet.update({ where: { id }, data: { linkedinStatus: "failed" } });
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function rejectTweet(formData: FormData) {
  const userId = await requireUserId();
  await assertProPlan(userId);
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing tweet id.");
  await prisma.newsTweet.update({ where: { id, userId }, data: { status: "rejected" } });
  revalidatePath("/news");
}

export async function markTweetPosted(formData: FormData) {
  const userId = await requireUserId();
  await assertProPlan(userId);
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing tweet id.");
  await prisma.newsTweet.update({
    where: { id, userId },
    data: { status: "posted", postedAt: new Date() },
  });
  revalidatePath("/news");
  revalidatePath("/news/history");
}

export async function updateNewsTweet(id: string, tweet: string) {
  const userId = await requireUserId();
  await assertProPlan(userId);
  await prisma.newsTweet.update({ where: { id, userId }, data: { tweet } });
  revalidatePath("/news");
}

export async function regenerateNewsTweet(id: string, additionalPrompt?: string): Promise<string> {
  const userId = await requireUserId();
  await assertProPlan(userId);

  const existing = await prisma.newsTweet.findFirst({
    where: { id, userId },
    select: { articleTitle: true, articleUrl: true },
  });
  if (!existing) throw new Error("Tweet not found.");

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { voiceMemory: true, newsTasteProfile: true },
  });

  const tweet = await generateNewsTweet({
    title: existing.articleTitle,
    summary: "",
    voiceMemory: settings?.voiceMemory ?? undefined,
    tasteProfile: settings?.newsTasteProfile ?? undefined,
    additionalPrompt,
  });

  await prisma.newsTweet.update({ where: { id, userId }, data: { tweet } });
  revalidatePath("/news");
  return tweet;
}

export async function sendManualDigest(): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  await assertProPlan(userId);
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { user: { select: { email: true, name: true } } },
  });

  const email = settings?.user.email;
  if (!email) return { ok: false, error: "No email on account." };

  const pending = await prisma.newsTweet.findMany({
    where: { userId, status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { articleUrl: true, articleTitle: true, tweet: true },
  });

  if (pending.length === 0) return { ok: false, error: "No pending articles in queue." };

  const articles: IngestArticle[] = pending.map((t) => ({
    title: t.articleTitle,
    url: t.articleUrl,
    tweet: t.tweet,
  }));

  console.log(`[manual-digest] sending ${articles.length} articles to ${email}`);

  try {
    await sendNewsDigestEmail({ to: email, name: settings?.user.name, articles });
    return { ok: true };
  } catch (err) {
    console.error(`[manual-digest] failed:`, err);
    return { ok: false, error: String(err) };
  }
}

export async function flushNews() {
  const userId = await requireUserId();
  await assertProPlan(userId);
  await prisma.newsTweet.deleteMany({ where: { userId } });
  await prisma.seenUrl.deleteMany({ where: { userId } });
  revalidatePath("/news");
}

export async function saveNewsSettings(formData: FormData) {
  const userId = await requireUserId();
  await assertProPlan(userId);
  const newsTone = String(formData.get("newsTone") ?? "mixed").trim();
  const newsAutoFetch = formData.get("newsAutoFetch") === "true";
  const newsEmailEnabled = formData.get("newsEmailEnabled") === "true";
  const newsKeywords = String(formData.get("newsKeywords") ?? "").trim();
  const newsTasteProfile = String(formData.get("newsTasteProfile") ?? "").trim();

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, newsTone, newsAutoFetch, newsEmailEnabled, newsKeywords, newsTasteProfile },
    update: { newsTone, newsAutoFetch, newsEmailEnabled, newsKeywords, newsTasteProfile },
  });

  revalidatePath("/news/settings");
  revalidatePath("/news");
}
