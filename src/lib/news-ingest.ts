import OpenAI from "openai";
import dns from "dns";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SOURCES, fetchHNAlgoliaItems, parseRss, uniqueByUrl, type RssItem } from "@/lib/news-rss";
import { generateNewsTweet } from "@/lib/ai";

// Force IPv4 — same fix as ai.ts
dns.setDefaultResultOrder("ipv4first");

const MAX_ARTICLES_PER_RUN = 15;
const GROQ_DELAY_MS = 1500;
const AI_SCORE_THRESHOLD = 7; // out of 10

export type IngestArticle = {
  title: string;
  url: string;
  tweet: string;
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
async function scoreItems(items: RssItem[], keywords?: string): Promise<Map<number, number>> {
  const scores = new Map<number, number>();
  if (items.length === 0) return scores;

  const client = getGroqClient();

  const numbered = items
    .map((item, i) => `${i}. ${item.title}${item.description ? ` — ${item.description.slice(0, 120)}` : ""}`)
    .join("\n");

  const userInterestLine = keywords
    ? `\nUser interests: "${keywords}". Articles directly relevant to these topics or companies should score at least 1 point higher than they otherwise would.`
    : "";

  const system = `You are a signal filter for a developer news digest. Score each article 1–10 for how impactful it is to a software developer who cares about AI and tech.${userInterestLine}

Scoring guide:
9–10: Any new AI model release, new AI API or feature launch, new AI agent capability — from ANY company (OpenAI, Anthropic, Google, Meta, Mistral, etc.). Also: viral open-source project, paradigm-shifting framework release, critical security vulnerability.
7–8:  New AI research with immediate practical use, new AI product entering public beta, significant non-AI framework release reaching stable/v1, major architectural change in a widely-used project.
4–6:  Blog posts and opinion pieces, incremental AI updates with no new capability, minor version bumps, patch releases, pre-release builds (alpha/beta/rc/-pre), changelog-only posts.
1–3:  Funding rounds, layoffs, company announcements with no technical substance, recycled news, opinion pieces.

IMPORTANT: Any genuinely new AI feature or model from any company — even a lesser-known one — must score 8 or above. Pre-release versions (v0.x, -pre, -rc, -alpha, -beta), patch bumps, and changelogs with no user-facing capability change must score 5 or below.

Return ONLY a JSON array of objects with index and score. No explanation. Example:
[{"index":0,"score":9},{"index":1,"score":4}]`;

  try {
    const res = await client.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
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
    newsKeywords: settings?.newsKeywords ?? undefined,
    newsTasteProfile: settings?.newsTasteProfile ?? undefined,
  };
}

export async function runNewsIngestForUser(userId: string): Promise<IngestResult> {
  const settings = await getUserNewsSettings(userId);

  const userKeywords = settings.newsKeywords
    ? settings.newsKeywords.split(",").map((k) => k.trim()).filter(Boolean).slice(0, 5)
    : [];

  // Default HN queries — high-signal frontpage topics
  const defaultHNQueries = ["Show HN", "Ask HN", "release"];

  const [feeds, hnItems] = await Promise.all([
    // RSS sources in parallel
    Promise.allSettled(
      DEFAULT_SOURCES.map((url) =>
        fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) })
          .then((r) => (r.ok ? r.text() : ""))
          .catch(() => ""),
      ),
    ),
    // HN Algolia: default queries (100+ points) + user keywords (50+ points)
    fetchHNAlgoliaItems(
      [...defaultHNQueries, ...userKeywords],
      userKeywords.length > 0 ? 50 : 100,
    ),
  ]);

  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const rssItems = feeds
    .flatMap((res) => (res.status === "fulfilled" && res.value ? parseRss(res.value) : []))
    .filter((item) => {
      if (!item.pubDate) return true; // no date = keep
      const t = new Date(item.pubDate).getTime();
      return isNaN(t) || t >= cutoff;
    });

  // HN keyword items first so they survive the 300-item slice
  const items = [...hnItems, ...rssItems];

  console.log(`[ingest] rss=${rssItems.length} hn=${hnItems.length} total=${items.length}`);

  const deduped = uniqueByUrl(items).slice(0, userKeywords.length > 0 ? 2000 : 300);

  // Filter already-seen URLs
  const existingUrls = await prisma.seenUrl.findMany({
    where: { userId, url: { in: deduped.map((i) => i.link) } },
    select: { url: true },
  });
  const existingSet = new Set(existingUrls.map((u) => u.url));
  const fresh = deduped.filter((i) => !existingSet.has(i.link));

  console.log(`[ingest] deduped=${deduped.length} fresh=${fresh.length} seenUrls=${existingSet.size}`);

  if (fresh.length === 0) return { added: 0, articles: [] };

  // When user has keywords, hard-filter to only matching items
  const toScore = userKeywords.length > 0
    ? fresh.filter((item) => {
        const text = `${item.title} ${item.description ?? ""}`.toLowerCase();
        return userKeywords.some((kw) => text.includes(kw.toLowerCase()));
      })
    : fresh;

  console.log(`[ingest] keywords=${userKeywords.join(",")} toScore=${toScore.length}`);

  if (toScore.length === 0) return { added: 0, articles: [] };

  // When user has keywords, trust the pre-filter — skip AI scoring
  let highSignal: RssItem[];
  if (userKeywords.length > 0) {
    highSignal = toScore.slice(0, MAX_ARTICLES_PER_RUN);
  } else {
    highSignal = [];
    const BATCH = 25;
    for (let i = 0; i < toScore.length; i += BATCH) {
      const batch = toScore.slice(i, i + BATCH);
      const scores = await scoreItems(batch, settings.newsKeywords);

      for (let j = 0; j < batch.length; j++) {
        const score = scores.get(j) ?? 5;
        if (score >= AI_SCORE_THRESHOLD) {
          highSignal.push(batch[j]);
        }
      }

      if (highSignal.length >= MAX_ARTICLES_PER_RUN) break;
      if (i + BATCH < toScore.length) await sleep(500);
    }
  }

  const toProcess = highSignal.slice(0, MAX_ARTICLES_PER_RUN);
  const articles: IngestArticle[] = [];

  for (const item of toProcess) {
    const claim = await prisma.seenUrl.upsert({
      where: { userId_url: { userId, url: item.link } },
      create: { userId, url: item.link },
      update: {},
      select: { seenAt: true },
    });
    if (Date.now() - claim.seenAt.getTime() > 1000) continue;

    const summary = (item.description || "").slice(0, 1200);
    const tweet = await generateNewsTweet({
      title: item.title,
      summary,
      voiceMemory: settings.voiceMemory,
      tasteProfile: settings.newsTasteProfile,
    });

    await prisma.newsTweet.create({
      data: {
        userId,
        articleUrl: item.link,
        articleTitle: item.title,
        tone: "informative",
        tweet,
        status: "pending",
      },
    });

    articles.push({ title: item.title, url: item.link, tweet });
    await sleep(GROQ_DELAY_MS);
  }

  return { added: toProcess.length, articles };
}
