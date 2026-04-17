"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { runNewsIngestForUser } from "@/lib/news-ingest";

export async function ingestNews() {
  const userId = await requireUserId();
  const result = await runNewsIngestForUser(userId);
  revalidatePath("/news");
  return result;
}

export async function getLastFetchTime(): Promise<Date | null> {
  const userId = await requireUserId();
  const latest = await prisma.seenUrl.findFirst({
    where: { userId },
    orderBy: { seenAt: "desc" },
    select: { seenAt: true },
  });
  return latest?.seenAt ?? null;
}

export async function getPendingTweets() {
  const userId = await requireUserId();
  const allPending = await prisma.newsTweet.findMany({
    where: { userId, status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, articleUrl: true, articleTitle: true, tone: true, tweet: true, createdAt: true },
  });

  const seen = new Map<string, typeof allPending[0]>();
  for (const t of allPending) {
    if (!seen.has(t.articleUrl) || t.tone === "informative") {
      seen.set(t.articleUrl, t);
    }
  }
  return Array.from(seen.values());
}

export async function approveTweet(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing tweet id.");
  await prisma.newsTweet.update({ where: { id, userId }, data: { status: "approved" } });
  revalidatePath("/news");
}

export async function rejectTweet(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing tweet id.");
  await prisma.newsTweet.update({ where: { id, userId }, data: { status: "rejected" } });
  revalidatePath("/news");
}

export async function markTweetPosted(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing tweet id.");
  await prisma.newsTweet.update({
    where: { id, userId },
    data: { status: "posted", postedAt: new Date() },
  });
  revalidatePath("/news");
  revalidatePath("/news/history");
}

export async function saveNewsSettings(formData: FormData) {
  const userId = await requireUserId();
  const newsTone = String(formData.get("newsTone") ?? "mixed").trim();
  const newsAutoFetch = formData.get("newsAutoFetch") === "true";
  const newsEmailEnabled = formData.get("newsEmailEnabled") === "true";

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, newsTone, newsAutoFetch, newsEmailEnabled },
    update: { newsTone, newsAutoFetch, newsEmailEnabled },
  });

  revalidatePath("/news/settings");
  revalidatePath("/news");
}
