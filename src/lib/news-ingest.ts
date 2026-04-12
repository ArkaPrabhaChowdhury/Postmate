import { prisma } from "@/lib/prisma";
import { DEFAULT_KEYWORDS, DEFAULT_SOURCES, filterByKeywords, parseRss, uniqueByUrl } from "@/lib/news-rss";
import { generateTweetVariants } from "@/lib/ai";

const MAX_ARTICLES_PER_RUN = 10;
const GROQ_DELAY_MS = 1500;

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

function parseList(input: string | null | undefined, fallback: string[]): string[] {
  const raw = (input ?? "").trim();
  if (!raw) return fallback;
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const DEFAULT_RSSHUB_URL = "https://rsshub.app";

async function getUserNewsSettings(userId: string) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  const rsshubBase = (settings?.rsshubUrl ?? DEFAULT_RSSHUB_URL).replace(/\/$/, "");
  const xHandles = parseList(settings?.xAccounts, []);
  const xSources = xHandles.map((handle) => `${rsshubBase}/twitter/user/${handle.replace(/^@/, "")}`);

  return {
    voiceMemory: settings?.voiceMemory ?? undefined,
    tone: settings?.tone ?? undefined,
    sources: [...parseList(settings?.newsSources, DEFAULT_SOURCES), ...xSources],
    keywords: parseList(settings?.newsKeywords, DEFAULT_KEYWORDS),
    newsTone: settings?.newsTone ?? undefined,
    exclude: parseList(settings?.newsExclude, ["politics", "war", "elections"]),
  };
}

export async function runNewsIngestForUser(userId: string): Promise<IngestResult> {
  const settings = await getUserNewsSettings(userId);

  const feeds = await Promise.allSettled(
    settings.sources.map((url) =>
      fetch(url, { cache: "no-store" }).then((r) => (r.ok ? r.text() : "")),
    ),
  );

  const items = feeds.flatMap((res) =>
    res.status === "fulfilled" && res.value ? parseRss(res.value) : [],
  );
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

  const articles: IngestArticle[] = [];

  for (const item of fresh) {
    await prisma.seenUrl.create({ data: { userId, url: item.link } });

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

    articles.push({ title: item.title, url: item.link, tweets: variants });

    await sleep(GROQ_DELAY_MS);
  }

  return { added: fresh.length, articles };
}
