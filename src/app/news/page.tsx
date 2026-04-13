import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { approveTweet, ingestNews, markTweetPosted, rejectTweet } from "./actions";
import { ArrowRight, Check, X, RefreshCw, Twitter } from "lucide-react";

type Group = {
  articleUrl: string;
  articleTitle: string;
  items: Array<{ id: string; tone: string; tweet: string; status: string; createdAt: Date }>;
};

export default async function NewsPage() {
  const userId = await requireUserId();

  const pending = await prisma.newsTweet.findMany({
    where: { userId, status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, articleUrl: true, articleTitle: true, tone: true, tweet: true, status: true, createdAt: true },
  });

  const grouped = new Map<string, Group>();
  for (const t of pending) {
    const key = t.articleUrl;
    const g = grouped.get(key) ?? {
      articleUrl: t.articleUrl,
      articleTitle: t.articleTitle,
      items: [],
    };
    g.items.push({ id: t.id, tone: t.tone, tweet: t.tweet, status: t.status, createdAt: t.createdAt });
    grouped.set(key, g);
  }

  const groups = Array.from(grouped.values());

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-8">
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
              High-signal tech news → AI-drafted tweets for your review.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <form action={ingestNews}>
              <button className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] rounded-lg transition-colors">
                <RefreshCw size={12} />
                Fetch now
              </button>
            </form>
            <Link
              href="/news/settings"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-[#888] rounded-lg transition-colors"
            >
              Settings
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="border border-white/[0.08] rounded-xl p-10 text-center">
            <p className="text-[#555] text-sm">No pending tweets yet.</p>
            <p className="text-[#444] text-xs mt-1">Click &ldquo;Fetch now&rdquo; to ingest RSS feeds.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map((g) => (
              <div key={g.articleUrl} className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0c0c0c]">
                {/* Article header */}
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <a
                      href={g.articleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-[#f0ede8] hover:text-[#d4ff00] transition-colors"
                    >
                      {g.articleTitle}
                    </a>
                    <a
                      href={g.articleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-[#555] hover:text-[#888] mt-1 truncate block transition-colors"
                    >
                      {g.articleUrl}
                    </a>
                  </div>
                  <Link
                    href="/news/history"
                    className="text-xs text-[#666] hover:text-[#f0ede8] transition-colors flex-shrink-0"
                  >
                    History →
                  </Link>
                </div>

                {/* Tweet variants */}
                <div className="p-4 grid gap-3 md:grid-cols-2">
                  {g.items.map((t) => (
                    <div key={t.id} className="border border-white/[0.06] rounded-xl p-4 bg-[#090909]">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-[#555] mb-2">
                        {t.tone}
                      </div>
                      <p className="text-sm text-[#e0ddd8] leading-relaxed whitespace-pre-wrap">
                        {t.tweet}
                      </p>
                      <div className="mt-4 flex items-center gap-2 flex-wrap">
                        <form action={approveTweet}>
                          <input type="hidden" name="id" value={t.id} />
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors">
                            <Check size={11} />
                            Approve
                          </button>
                        </form>
                        <form action={rejectTweet}>
                          <input type="hidden" name="id" value={t.id} />
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">
                            <X size={11} />
                            Reject
                          </button>
                        </form>
                        <form action={markTweetPosted}>
                          <input type="hidden" name="id" value={t.id} />
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white/[0.05] text-[#888] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition-colors">
                            Mark posted
                          </button>
                        </form>
                        <a
                          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(t.tweet + "\n\n" + g.articleUrl)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-black text-white border border-white/[0.1] rounded-lg hover:bg-white/[0.06] transition-colors"
                        >
                          <Twitter size={11} />
                          Tweet
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
