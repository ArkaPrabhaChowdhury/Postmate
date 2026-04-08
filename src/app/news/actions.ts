"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { DEFAULT_KEYWORDS, DEFAULT_SOURCES, filterByKeywords, parseRss, uniqueByUrl } from "@/lib/news-rss";
import { generateTweetVariants } from "@/lib/ai";

const MAX_ARTICLES_PER_RUN = 10;
const GEMINI_DELAY_MS = 4000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseList(input: string | null | undefined, fallback: string[]): string[] {
  const raw = (input ?? "").trim();
  if (!raw) return fallback;
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function getUserNewsSettings(userId: string) {
  const settingsClient = prisma as unknown as {
    userSettings?: {
      findUnique: (args: { where: { userId: string } }) => Promise<{
        voiceMemory?: string | null;
        tone?: string | null;
        newsSources?: string | null;
        newsKeywords?: string | null;
        newsTone?: string | null;
        newsExclude?: string | null;
      } | null>;
    };
  };
  const settings = settingsClient.userSettings
    ? await settingsClient.userSettings.findUnique({ where: { userId } })
    : null;

  return {
    voiceMemory: settings?.voiceMemory ?? undefined,
    tone: settings?.tone ?? undefined,
    sources: parseList(settings?.newsSources, DEFAULT_SOURCES),
    keywords: parseList(settings?.newsKeywords, DEFAULT_KEYWORDS),
    newsTone: settings?.newsTone ?? undefined,
    exclude: parseList(settings?.newsExclude, ["politics", "war", "elections"]),
  };
}

export async function ingestNews() {
  const userId = await requireUserId();
  const settings = await getUserNewsSettings(userId);

  const feeds = await Promise.allSettled(
    settings.sources.map((url) =>
      fetch(url, { cache: "no-store" }).then((r) => (r.ok ? r.text() : "")),
    ),
  );

  const items = feeds.flatMap((res) => (res.status === "fulfilled" && res.value ? parseRss(res.value) : []));
  const filtered = filterByKeywords(items, settings.keywords);
  const excluded = settings.exclude.map((e) => e.toLowerCase());
  const cleaned = filtered.filter((i) => {
    const hay = `${i.title} ${i.description}`.toLowerCase();
    return !excluded.some((e) => hay.includes(e));
  });
  const deduped = uniqueByUrl(cleaned).slice(0, 200);

  const existingUrls = await prisma.seenUrl.findMany({
    where: { userId, url: { in: deduped.map((i) => i.link) } },
    select: { url: true },
  });
  const existingSet = new Set(existingUrls.map((u) => u.url));

  const fresh = deduped.filter((i) => !existingSet.has(i.link)).slice(0, MAX_ARTICLES_PER_RUN);

  for (const item of fresh) {
    await prisma.seenUrl.create({
      data: { userId, url: item.link },
    });

    const summary = (item.description || "").slice(0, 1200);
    const variants = await generateTweetVariants({
      title: item.title,
      summary,
      voiceMemory: settings.voiceMemory ?? undefined,
      tone: settings.tone ?? undefined,
      preferredTone: settings.newsTone ?? undefined,
    });

    await prisma.newsTweet.createMany({
      data: variants.map((v) => ({
        userId,
        articleUrl: item.link,
        articleTitle: item.title,
        tone: v.tone,
        tweet: v.tweet,
        status: "pending",
      })),
    });

    await sleep(GEMINI_DELAY_MS);
  }

  revalidatePath("/news");
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
  const newsSources = String(formData.get("newsSources") ?? "").trim();
  const newsKeywords = String(formData.get("newsKeywords") ?? "").trim();
  const newsTone = String(formData.get("newsTone") ?? "mixed").trim();
  const newsExclude = String(formData.get("newsExclude") ?? "").trim();

  const settingsClient = prisma as unknown as {
    userSettings?: {
      upsert: (args: {
        where: { userId: string };
        create: { userId: string; newsSources?: string | null; newsKeywords?: string | null; newsTone?: string | null; newsExclude?: string | null };
        update: { newsSources?: string | null; newsKeywords?: string | null; newsTone?: string | null; newsExclude?: string | null };
      }) => Promise<unknown>;
    };
  };

  if (settingsClient.userSettings) {
    await settingsClient.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        newsSources: newsSources || null,
        newsKeywords: newsKeywords || null,
        newsTone: newsTone || null,
        newsExclude: newsExclude || null,
      },
      update: {
        newsSources: newsSources || null,
        newsKeywords: newsKeywords || null,
        newsTone: newsTone || null,
        newsExclude: newsExclude || null,
      },
    });
  }

  revalidatePath("/news/settings");
  revalidatePath("/news");
}
