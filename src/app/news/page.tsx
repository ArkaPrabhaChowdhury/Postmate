import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { approveTweet, ingestNews, markTweetPosted, rejectTweet } from "./actions";
import { ArrowRight, Check, X, Clock, Twitter } from "lucide-react";

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
    <div className="flex flex-col gap-8 p-9">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">News queue</h1>
          <p className="text-xs text-zinc-500 mt-1">High-signal tech news → draft tweets for review.</p>
        </div>
        <div className="flex items-center gap-2">
          <form action={ingestNews}>
            <button className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg transition-colors">
              <Clock size={12} />
              Fetch now
            </button>
          </form>
          <Link
            href="/news/settings"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition-colors"
          >
            Settings
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
          No pending tweets yet. Click “Fetch now” to ingest RSS.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <div key={g.articleUrl} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <a href={g.articleUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-zinc-100 hover:underline">
                    {g.articleTitle}
                  </a>
                  <div className="text-[11px] text-zinc-500 mt-1 truncate">{g.articleUrl}</div>
                </div>
                <Link href="/news/history" className="text-xs text-zinc-400 hover:text-zinc-200">History →</Link>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {g.items.map((t) => (
                  <div key={t.id} className="border border-zinc-800 rounded-lg p-3 bg-zinc-950">
                    <div className="text-[11px] uppercase tracking-wider text-zinc-500">{t.tone}</div>
                    <p className="mt-2 text-sm text-zinc-200 whitespace-pre-wrap">{t.tweet}</p>
                    <div className="mt-3 flex items-center gap-2">
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
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors">
                          Mark posted
                        </button>
                      </form>
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(t.tweet)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-black text-white border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        <Twitter size={12} />
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
  );
}
