export type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
};

// GitHub releases for high-signal runtimes, frameworks, and tooling
const GITHUB_RELEASES: string[] = [
  // Runtimes
  "https://github.com/oven-sh/bun/releases.atom",
  "https://github.com/denoland/deno/releases.atom",
  "https://github.com/nodejs/node/releases.atom",

  // Frontend frameworks
  "https://github.com/vercel/next.js/releases.atom",
  "https://github.com/facebook/react/releases.atom",
  "https://github.com/vitejs/vite/releases.atom",
  "https://github.com/sveltejs/kit/releases.atom",
  "https://github.com/withastro/astro/releases.atom",

  // Languages & compilers
  "https://github.com/microsoft/TypeScript/releases.atom",
  "https://github.com/rust-lang/rust/releases.atom",
  "https://github.com/golang/go/releases.atom",

  // Tooling
  "https://github.com/astral-sh/uv/releases.atom",
  "https://github.com/astral-sh/ruff/releases.atom",
  "https://github.com/biomejs/biome/releases.atom",
  "https://github.com/tailwindlabs/tailwindcss/releases.atom",
  "https://github.com/prisma/prisma/releases.atom",
  "https://github.com/oxc-project/oxc/releases.atom",

  // Editors & apps
  "https://github.com/zed-industries/zed/releases.atom",
  "https://github.com/tauri-apps/tauri/releases.atom",

  // AI/ML tooling
  "https://github.com/ollama/ollama/releases.atom",
  "https://github.com/ggml-org/llama.cpp/releases.atom",
];

// Official blogs with concrete release/feature announcements
const OFFICIAL_BLOGS: string[] = [
  "https://bun.sh/blog/rss.xml",
  "https://deno.com/feed",
  "https://vercel.com/blog/rss.xml",
  "https://blog.cloudflare.com/rss/",
  "https://github.blog/feed/",
];

// AI company blogs — every new model, API, or feature announcement
const AI_BLOGS: string[] = [
  // Labs
  "https://www.anthropic.com/rss.xml",
  "https://openai.com/blog/rss.xml",
  "https://deepmind.google/blog/rss/",
  "https://mistral.ai/news/rss",
  "https://blog.google/technology/ai/rss/",
  "https://research.google/blog/rss/",
  "https://ai.meta.com/blog/rss/",
  "https://huggingface.co/blog/feed.xml",
  "https://blogs.microsoft.com/ai/feed/",
  "https://aws.amazon.com/blogs/machine-learning/feed/",
  "https://blogs.nvidia.com/blog/category/generative-ai/feed/",
  "https://cohere.com/blog/rss",
  "https://www.together.ai/blog/rss.xml",
  "https://stability.ai/blog/rss.xml",
  // AI-section feeds from tech outlets
  "https://techcrunch.com/category/artificial-intelligence/feed/",
  "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
  "https://venturebeat.com/category/ai/feed/",
  "https://www.wired.com/feed/tag/artificial-intelligence/latest/rss",
];

// Hacker News — fetched via Algolia API (see fetchHNAlgoliaItems), not RSS

// GitHub Trending — community-curated viral projects
const TRENDING_FEEDS: string[] = [
  "https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml",
];

// Discovery feeds
const DISCOVERY_FEEDS: string[] = [
  "https://www.producthunt.com/feed?category=developer-tools",
  "https://lobste.rs/s/rss",
];

export const DEFAULT_SOURCES: string[] = [
  ...AI_BLOGS,
  ...OFFICIAL_BLOGS,
  ...TRENDING_FEEDS,
  ...DISCOVERY_FEEDS,
];

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeUrl(url: string): string {
  return url.replace(/#.*$/, "").trim();
}

export function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];

  // RSS 2.0: split on <item>
  const itemBlocks = xml.split(/<item[\s>]/i).slice(1);
  if (itemBlocks.length > 0) {
    for (const block of itemBlocks) {
      const title = (
        block.match(/<title><!\[CDATA\[(.*?)]]><\/title>/i)?.[1] ??
        block.match(/<title>(.*?)<\/title>/i)?.[1] ??
        ""
      ).trim();
      const link = (
        block.match(/<link>(.*?)<\/link>/i)?.[1] ??
        block.match(/<link><!\[CDATA\[(.*?)]]><\/link>/i)?.[1] ??
        ""
      ).trim();
      const description = (
        block.match(/<description><!\[CDATA\[(.*?)]]><\/description>/i)?.[1] ??
        block.match(/<description>(.*?)<\/description>/i)?.[1] ??
        ""
      ).trim();
      const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1] ?? "").trim();

      if (!title || !link) continue;
      items.push({
        title: stripHtml(title),
        link: normalizeUrl(link),
        description: stripHtml(description),
        pubDate: pubDate || undefined,
      });
    }
    return items;
  }

  // Atom 1.0 fallback
  const entryBlocks = xml.split(/<entry[\s>]/i).slice(1);
  for (const block of entryBlocks) {
    const title = (
      block.match(/<title[^>]*><!\[CDATA\[(.*?)]]><\/title>/i)?.[1] ??
      block.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] ??
      ""
    ).trim();

    const link = (
      block.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
      block.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/>/i)?.[1] ??
      block.match(/<id>(https?:\/\/[^<]+)<\/id>/i)?.[1] ??
      ""
    ).trim();

    const description = (
      block.match(/<summary[^>]*><!\[CDATA\[(.*?)]]><\/summary>/i)?.[1] ??
      block.match(/<summary[^>]*>(.*?)<\/summary>/i)?.[1] ??
      block.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1] ??
      ""
    ).trim();

    const pubDate = (
      block.match(/<published>(.*?)<\/published>/i)?.[1] ??
      block.match(/<updated>(.*?)<\/updated>/i)?.[1] ??
      ""
    ).trim();

    if (!title || !link) continue;
    items.push({
      title: stripHtml(title),
      link: normalizeUrl(link),
      description: stripHtml(description),
      pubDate: pubDate || undefined,
    });
  }

  return items;
}

type HNAlgoliaHit = {
  objectID: string;
  title?: string;
  story_title?: string;
  url?: string;
  points?: number;
  story_text?: string;
  created_at?: string;
};

/**
 * Fetch HN stories via Algolia search_by_date API (newest first).
 * queries: search terms (fetched in parallel, results merged + deduped)
 * minPoints: minimum score filter
 * maxAgeDays: only return stories newer than this (default 7 days)
 */
export async function fetchHNAlgoliaItems(
  queries: string[],
  minPoints = 50,
  maxAgeDays = 7,
): Promise<RssItem[]> {
  if (queries.length === 0) return [];

  const since = Math.floor((Date.now() - maxAgeDays * 24 * 60 * 60 * 1000) / 1000);

  const results = await Promise.allSettled(
    queries.map((q) => {
      const params = new URLSearchParams({
        query: q,
        tags: "story",
        numericFilters: `points>=${minPoints},created_at_i>=${since}`,
        hitsPerPage: "30",
      });
      return fetch(`https://hn.algolia.com/api/v1/search_by_date?${params}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      })
        .then((r) => (r.ok ? r.json() : { hits: [] }))
        .catch(() => ({ hits: [] }));
    }),
  );

  const items: RssItem[] = [];
  for (const res of results) {
    if (res.status !== "fulfilled") continue;
    const hits: HNAlgoliaHit[] = res.value?.hits ?? [];
    for (const hit of hits) {
      const title = hit.title ?? hit.story_title ?? "";
      if (!title) continue;
      const link = hit.url
        ? normalizeUrl(hit.url)
        : `https://news.ycombinator.com/item?id=${hit.objectID}`;
      items.push({
        title,
        link,
        description: hit.story_text ? stripHtml(hit.story_text).slice(0, 300) : "",
        pubDate: hit.created_at,
      });
    }
  }

  return uniqueByUrl(items);
}

export function uniqueByUrl(items: RssItem[]): RssItem[] {
  const seen = new Set<string>();
  const out: RssItem[] = [];
  for (const i of items) {
    if (seen.has(i.link)) continue;
    seen.add(i.link);
    out.push(i);
  }
  return out;
}
