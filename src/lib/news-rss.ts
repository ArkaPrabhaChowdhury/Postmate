export type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
};

export const DEFAULT_SOURCES = [
  "https://techcrunch.com/feed/",
  "https://www.theverge.com/rss/index.xml",
  "https://venturebeat.com/feed/",
  "https://hnrss.org/frontpage",
  "https://hnrss.org/newest?q=AI",
  "https://www.reddit.com/r/artificial.rss",
  "https://layoffs.fyi/feed/",
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
  const itemBlocks = xml.split(/<item[\s>]/i).slice(1);
  for (const block of itemBlocks) {
    const title = (block.match(/<title><!\[CDATA\[(.*?)]]><\/title>/i)?.[1]
      ?? block.match(/<title>(.*?)<\/title>/i)?.[1]
      ?? "").trim();
    const link = (block.match(/<link>(.*?)<\/link>/i)?.[1]
      ?? block.match(/<link><!\[CDATA\[(.*?)]]><\/link>/i)?.[1]
      ?? "").trim();
    const description = (block.match(/<description><!\[CDATA\[(.*?)]]><\/description>/i)?.[1]
      ?? block.match(/<description>(.*?)<\/description>/i)?.[1]
      ?? "").trim();
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
