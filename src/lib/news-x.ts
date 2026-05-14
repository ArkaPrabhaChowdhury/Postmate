import { chromium } from "playwright";
import { logExtraction } from "@/lib/logger";
import type { RssItem } from "@/lib/news-rss";

type XPost = {
  account: string;
  link: string;
  title: string;
  description: string;
  pubDate?: string;
};

type CachedItems = {
  expiresAt: number;
  key: string;
  items: RssItem[];
};

const DEFAULT_X_ACCOUNTS = [
  "OpenAI",
  "AnthropicAI",
  "GoogleDeepMind",
  "GeminiApp",
  "perplexity_ai",
];

const X_POSTS_PER_ACCOUNT = Math.min(
  5,
  Math.max(1, Number(process.env.NEWS_X_POSTS_PER_ACCOUNT ?? "2") || 2),
);
const X_MAX_AGE_DAYS = Math.min(
  365,
  Math.max(1, Number(process.env.NEWS_X_MAX_AGE_DAYS ?? "365") || 365),
);
const X_TIMEOUT_MS = Math.min(
  60_000,
  Math.max(10_000, Number(process.env.NEWS_X_TIMEOUT_MS ?? "30_000") || 30_000),
);
const X_CACHE_TTL_MS = Math.min(
  30 * 60 * 1000,
  Math.max(60 * 1000, Number(process.env.NEWS_X_CACHE_TTL_MS ?? "600000") || 600000),
);

let cachedItems: CachedItems | null = null;

function parseAccounts(): string[] {
  const raw = process.env.NEWS_X_ACCOUNTS?.trim();
  if (!raw) return DEFAULT_X_ACCOUNTS;

  return raw
    .split(",")
    .map((account) => account.trim().replace(/^@/, ""))
    .filter(Boolean);
}

function isXEnabled() {
  return process.env.NEWS_X_ENABLED !== "false";
}

function makeCacheKey(accounts: string[]) {
  return JSON.stringify({
    accounts,
    postsPerAccount: X_POSTS_PER_ACCOUNT,
    maxAgeDays: X_MAX_AGE_DAYS,
  });
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function acceptedAuthors(requestedAccount: string, resolvedUrl: string) {
  const handles = new Set([requestedAccount.toLowerCase()]);
  const match = resolvedUrl.match(/x\.com\/([^/?#]+)/i);
  if (match?.[1]) handles.add(match[1].toLowerCase().replace(/^@/, ""));
  return handles;
}

function cutoffTimeMs() {
  return Date.now() - X_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
}

async function scrapeAccount(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  account: string,
): Promise<RssItem[]> {
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  });

  try {
    await page.goto(`https://x.com/${account}`, {
      waitUntil: "domcontentloaded",
      timeout: X_TIMEOUT_MS,
    });
    await page.waitForSelector("article", { timeout: X_TIMEOUT_MS });
    await page.waitForTimeout(2500);

    const accepted = Array.from(acceptedAuthors(account, page.url()));
    const cutoffMs = cutoffTimeMs();

    const items = await page.$$eval(
      "article",
      (articles, context) => {
        const normalizedAccepted = new Set(context.accepted.map((value) => value.toLowerCase()));
        const results: XPost[] = [];
        const seen = new Set<string>();

        for (const article of articles) {
          if (results.length >= context.postsPerAccount) break;

          const socialContext = article.querySelector('[data-testid="socialContext"]');
          const socialText = socialContext?.textContent?.trim().toLowerCase() ?? "";
          if (socialText === "pinned") continue;

          const timeNode = article.querySelector("time");
          const tweetTextNode = article.querySelector('[data-testid="tweetText"]');
          if (!timeNode || !tweetTextNode) continue;

          const statusLinks = Array.from(article.querySelectorAll<HTMLAnchorElement>('a[href*="/status/"]'))
            .map((node) => node.getAttribute("href") ?? "")
            .filter(Boolean);
          if (statusLinks.length === 0) continue;

          const canonicalStatus = statusLinks.find(
            (href) => !href.includes("/analytics") && !href.includes("/photo/"),
          ) ?? statusLinks[0];

          const author = canonicalStatus.replace(/^\/+/, "").split("/", 1)[0]?.toLowerCase();
          if (!author || !normalizedAccepted.has(author)) continue;

          const postedAt = timeNode.getAttribute("datetime") ?? undefined;
          if (!postedAt) continue;

          const postedAtMs = Date.parse(postedAt);
          if (!Number.isFinite(postedAtMs) || postedAtMs < context.cutoffMs) continue;

          const text = tweetTextNode.textContent?.replace(/\s+/g, " ").trim() ?? "";
          if (!text) continue;

          const link = `https://x.com${canonicalStatus}`;
          if (seen.has(link)) continue;
          seen.add(link);

          results.push({
            account: context.account,
            link,
            title: text,
            description: text,
            pubDate: postedAt,
          });
        }

        return results;
      },
      {
        account,
        accepted,
        postsPerAccount: X_POSTS_PER_ACCOUNT,
        cutoffMs,
      },
    );

    logExtraction("news_x_scrape_result", {
      account,
      resolvedUrl: page.url(),
      count: items.length,
    });

    return items.map((item) => ({
      title: normalizeWhitespace(item.title),
      link: item.link,
      description: normalizeWhitespace(item.description),
      pubDate: item.pubDate,
    }));
  } finally {
    await page.close();
  }
}

export async function fetchLatestXItems(): Promise<RssItem[]> {
  if (!isXEnabled()) return [];

  const accounts = parseAccounts();
  if (accounts.length === 0) return [];

  const key = makeCacheKey(accounts);
  if (cachedItems && cachedItems.key === key && cachedItems.expiresAt > Date.now()) {
    return cachedItems.items;
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
  });

  let items: RssItem[] = [];
  try {
    const settled = await Promise.allSettled(accounts.map((account) => scrapeAccount(browser, account)));
    items = settled.flatMap((result, index) => {
      if (result.status === "fulfilled") return result.value;

      const account = accounts[index];
      logExtraction("news_x_scrape_error", {
        account,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
      return [];
    });
  } finally {
    await browser.close();
  }

  cachedItems = {
    key,
    expiresAt: Date.now() + X_CACHE_TTL_MS,
    items,
  };

  return items;
}
