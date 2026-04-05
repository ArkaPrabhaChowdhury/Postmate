const DEV_NEWS_URL =
  "https://news.google.com/rss/search?q=software%20development%20OR%20developer%20OR%20programming%20OR%20AI%20engineering&hl=en-US&gl=US&ceid=US:en";

export async function fetchDevNews(): Promise<string[]> {
  try {
    const res = await fetch(DEV_NEWS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch news");
    const xml = await res.text();
    const titles = [...xml.matchAll(/<title>(.*?)<\/title>/g)].map((m) => m[1]);
    return titles.slice(1).filter(Boolean).slice(0, 12);
  } catch {
    return [
      "Layoffs and hiring signals in big tech",
      "Open-source licensing shifts",
      "LLM evaluation practices",
      "RAG architectures in production",
      "Edge vs serverless cost tradeoffs",
      "GPU pricing and availability",
    ];
  }
}
