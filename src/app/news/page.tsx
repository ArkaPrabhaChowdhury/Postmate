"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { ingestNews, getPendingTweets, getLastFetchTime } from "./actions";
import { TweetCard } from "./TweetCard";

type NewsItem = {
  id: string;
  articleUrl: string;
  articleTitle: string;
  tweet: string;
  createdAt: Date;
};

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    async function init() {
      const [data, lastFetch] = await Promise.all([getPendingTweets(), getLastFetchTime()]);
      setItems(data);
      setLoaded(true);

      const TWO_HOURS = 2 * 60 * 60 * 1000;
      const stale = !lastFetch || Date.now() - new Date(lastFetch).getTime() > TWO_HOURS;
      if (stale) {
        setStatusMsg("Checking for new articles…");
        startTransition(async () => {
          try {
            const result = await ingestNews();
            const fresh = await getPendingTweets();
            setItems(fresh);
            setStatusMsg(result.added > 0 ? `Found ${result.added} new article${result.added !== 1 ? "s" : ""}.` : "");
          } catch {
            setStatusMsg("");
          }
        });
      }
    }
    init();
  }, []);

  function handleFetch() {
    setStatusMsg("Fetching RSS feeds and scoring articles…");
    startTransition(async () => {
      try {
        const result = await ingestNews();
        const fresh = await getPendingTweets();
        setItems(fresh);
        setStatusMsg(result.added > 0 ? `Added ${result.added} new article${result.added !== 1 ? "s" : ""}.` : "No new high-signal articles found.");
      } catch {
        setStatusMsg("Fetch failed. Try again.");
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-8 md:px-12 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1
              className="text-xl font-bold tracking-tight text-[#f0ede8]"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              News queue
            </h1>
            <p className="text-xs text-[#666] mt-1">
              High-signal tech news → AI-drafted tweets ready to post.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFetch}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw size={12} className={isPending ? "animate-spin" : ""} />
              {isPending ? "Fetching…" : "Fetch now"}
            </button>
            <Link
              href="/news/settings"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-[#888] rounded-lg transition-colors"
            >
              Settings
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Status message */}
        {isPending && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#d4ff00]/20 bg-[#d4ff00]/[0.05]">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#d4ff00] border-t-transparent animate-spin flex-shrink-0" />
            <p className="text-xs text-[#d4ff00]">{statusMsg}</p>
          </div>
        )}
        {!isPending && statusMsg && (
          <p className="text-xs text-[#666] px-1">{statusMsg}</p>
        )}

        {!loaded ? (
          <div className="border border-white/[0.08] rounded-xl p-10 text-center">
            <p className="text-[#555] text-sm">Loading…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="border border-white/[0.08] rounded-xl p-10 text-center">
            <p className="text-[#555] text-sm">No pending tweets yet.</p>
            <p className="text-[#444] text-xs mt-1">Click &ldquo;Fetch now&rdquo; to ingest RSS feeds.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <TweetCard
                key={item.id}
                id={item.id}
                articleUrl={item.articleUrl}
                articleTitle={item.articleTitle}
                tweet={item.tweet}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
