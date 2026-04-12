export type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
};

export const DEFAULT_SOURCES = [
  // General tech news
  "https://techcrunch.com/feed/",
  "https://www.theverge.com/rss/index.xml",
  "https://venturebeat.com/feed/",
  "https://layoffs.fyi/feed/",

  // Hacker News
  "https://hnrss.org/frontpage",
  "https://hnrss.org/newest?q=AI",
  "https://hnrss.org/newest?q=Anthropic+OR+Claude&points=10",
  "https://hnrss.org/newest?q=OpenAI+OR+ChatGPT&points=10",

  // Company official blogs — highest signal for model/feature releases
  "https://www.anthropic.com/rss.xml",
  "https://openai.com/blog/rss.xml",
  "https://deepmind.google/blog/rss.xml",
  "https://mistral.ai/feed",

  // Google News targeted RSS — aggregates coverage within minutes
  "https://news.google.com/rss/search?q=Anthropic+Claude+AI&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=OpenAI+model+release&hl=en-US&gl=US&ceid=US:en",

  // Reddit AI communities
  "https://www.reddit.com/r/artificial.rss",
  "https://www.reddit.com/r/MachineLearning.rss",
  "https://www.reddit.com/r/LocalLLaMA.rss",
];

export const DEFAULT_KEYWORDS = [
  "AI",
  "artificial intelligence",
  "layoff",
  "laid off",
  "hiring",
  "funding",
  "Series A",
  "Series B",
  "Claude",
  "Gemini",
  "GPT",
  "OpenAI",
  "Anthropic",
  "Mistral",
  "LLM",
  "model release",
  "agent",
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

  // Atom 1.0 fallback: split on <entry> (used by Google News, Anthropic blog, etc.)
  const entryBlocks = xml.split(/<entry[\s>]/i).slice(1);
  for (const block of entryBlocks) {
    const title = (
      block.match(/<title[^>]*><!\[CDATA\[(.*?)]]><\/title>/i)?.[1] ??
      block.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] ??
      ""
    ).trim();

    // Atom links: <link rel="alternate" href="..."/> or <link href="..."/> or <id>https://...</id>
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

export function filterByKeywords(items: RssItem[], keywords: string[]): RssItem[] {
  const set = keywords.map((k) => k.toLowerCase());
  return items.filter((i) => {
    const hay = `${i.title} ${i.description}`.toLowerCase();
    return set.some((k) => hay.includes(k.toLowerCase()));
  });
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
