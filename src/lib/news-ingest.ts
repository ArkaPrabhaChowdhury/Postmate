import OpenAI from "openai";
import dns from "dns";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SOURCES, parseRss, uniqueByUrl, type RssItem } from "@/lib/news-rss";
import { generateTweetVariants } from "@/lib/ai";

// Force IPv4 — same fix as ai.ts
dns.setDefaultResultOrder("ipv4first");

const MAX_ARTICLES_PER_RUN = 10;
const GROQ_DELAY_MS = 1500;
const AI_SCORE_THRESHOLD = 8; // out of 10

export type IngestArticle = {
  title: string;
  url: string;
  tweets: Array<{ tone: string; tweet: string }>;
};

export type IngestResult = {
  added: number;
  articles: IngestArticle[];
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getGroqClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY ?? "",
    baseURL: "https://api.groq.com/openai/v1",
  });
}

/**
 * Batch-score up to 30 items in a single Groq call.
 * Returns a map of index → score (1–10).
 * 8–10: concrete release with real improvements, viral tool, major AI launch
 * 5–7:  blog posts, minor updates, framework news
 * 1–4:  generic articles, rehashed news, opinion pieces
 */
async function scoreItems(items: RssItem[]): Promise<Map<number, number>> {
  const scores = new Map<number, number>();
  if (items.length === 0) return scores;

  const client = getGroqClient();

  const numbered = items
    .map((item, i) => `${i}. ${item.title}${item.description ? ` — ${item.description.slice(0, 120)}` : ""}`)
    .join("\n");

  const system = `You are a signal filter for a developer news digest. Score each article 1–10 for how impactful it is to the average software developer.

Scoring guide:
9–10: Major AI product launch (new model, new API, new agent capability), viral open-source project (10k+ stars overnight), paradigm-shifting framework release (e.g. React 19, Bun 1.0), critical security vulnerability in widely-used software
7–8:  Tool or framework reaching stable/v1 for the first time, significant architectural change in a major project, new AI research with immediate practical use
4–6:  Blog posts, minor version bumps (patch/pre-release), incremental feature additions, ecosystem housekeeping, pre-release builds, nightly/alpha/beta/rc releases
1–3:  Funding rounds, layoffs, company announcements without technical substance, opinion pieces, recycled news, changelog-only updates

IMPORTANT: pre-release versions (v0.x, -pre, -rc, -alpha, -beta, nightly), patch bumps (e.g. v1.2.3 → v1.2.4), and minor changelogs with no user-facing impact must score 5 or below.

Return ONLY a JSON array of objects with index and score. No explanation. Example:
[{"index":0,"score":9},{"index":1,"score":4}]`;

  try {
    const res = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 512,
      messages: [
        { role: "system", content: system },
        { role: "user", content: numbered },
      ],
    });

    const raw = res.choices[0]?.message?.content ?? "[]";
    // Extract JSON array even if model wraps it in markdown
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return scores;

    const parsed = JSON.parse(match[0]) as Array<{ index: number; score: number }>;
    for (const entry of parsed) {
      if (typeof entry.index === "number" && typeof entry.score === "number") {
        scores.set(entry.index, entry.score);
      }
    }
  } catch {
    // Scoring failed — let everything through rather than blocking all items
  }

  return scores;
}

async function getUserNewsSettings(userId: string) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return {
    voiceMemory: settings?.voiceMemory ?? undefined,
    tone: settings?.tone ?? undefined,
    newsTone: settings?.newsTone ?? undefined,
  };
}

export async function runNewsIngestForUser(userId: string): Promise<IngestResult> {
  const settings = await getUserNewsSettings(userId);

  // Fetch all sources in parallel
  const feeds = await Promise.allSettled(
    DEFAULT_SOURCES.map((url) =>
      fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) })
        .then((r) => (r.ok ? r.text() : ""))
        .catch(() => ""),
    ),
  );

  const items = feeds.flatMap((res) =>
    res.status === "fulfilled" && res.value ? parseRss(res.value) : [],
  );

  const deduped = uniqueByUrl(items).slice(0, 300);

  // Filter already-seen URLs
  const existingUrls = await prisma.seenUrl.findMany({
    where: { userId, url: { in: deduped.map((i) => i.link) } },
    select: { url: true },
  });
  const existingSet = new Set(existingUrls.map((u) => u.url));
  const fresh = deduped.filter((i) => !existingSet.has(i.link));

  if (fresh.length === 0) return { added: 0, articles: [] };

  // AI score in batches of 25
  const BATCH = 25;
  const highSignal: RssItem[] = [];

  for (let i = 0; i < fresh.length; i += BATCH) {
    const batch = fresh.slice(i, i + BATCH);
    const scores = await scoreItems(batch);

    for (let j = 0; j < batch.length; j++) {
      const score = scores.get(j) ?? 5; // default to 5 if scoring failed
      if (score >= AI_SCORE_THRESHOLD) {
        highSignal.push(batch[j]);
      }
    }

    if (highSignal.length >= MAX_ARTICLES_PER_RUN) break;
    if (i + BATCH < fresh.length) await sleep(500);
  }

  const toProcess = highSignal.slice(0, MAX_ARTICLES_PER_RUN);
  const articles: IngestArticle[] = [];

  for (const item of toProcess) {
    await prisma.seenUrl.create({ data: { userId, url: item.link } });

    const summary = (item.description || "").slice(0, 1200);
    const variants = await generateTweetVariants({
      title: item.title,
      summary,
      voiceMemory: settings.voiceMemory,
      tone: settings.tone,
      preferredTone: settings.newsTone,
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

    articles.push({ title: item.title, url: item.link, tweets: variants });
    await sleep(GROQ_DELAY_MS);
  }

  return { added: toProcess.length, articles };
}
