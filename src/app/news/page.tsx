import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { ingestNews } from "./actions";
import { ArrowRight, RefreshCw } from "lucide-react";

function XLogo({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1200 1227" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
    </svg>
  );
}

type NewsItem = {
  id: string;
  articleUrl: string;
  articleTitle: string;
  tone: string;
  tweet: string;
  createdAt: Date;
};

export default async function NewsPage() {
  const userId = await requireUserId();

  const allPending = await prisma.newsTweet.findMany({
    where: { userId, status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, articleUrl: true, articleTitle: true, tone: true, tweet: true, createdAt: true },
  });

  // One tweet per article — prefer "informative", fallback to first
  const seen = new Map<string, NewsItem>();
  for (const t of allPending) {
    if (!seen.has(t.articleUrl) || t.tone === "informative") {
      seen.set(t.articleUrl, t);
    }
  }
  const items = Array.from(seen.values());

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

        {items.length === 0 ? (
          <div className="border border-white/[0.08] rounded-xl p-10 text-center">
            <p className="text-[#555] text-sm">No pending tweets yet.</p>
            <p className="text-[#444] text-xs mt-1">Click &ldquo;Fetch now&rdquo; to ingest RSS feeds.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="border border-white/[0.08] rounded-xl bg-[#0c0c0c] overflow-hidden">
                {/* Source article */}
                <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-4">
                  <a
                    href={item.articleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#888] hover:text-[#d4ff00] transition-colors leading-snug line-clamp-1"
                  >
                    {item.articleTitle}
                  </a>
                </div>

                {/* Tweet body */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-[#e0ddd8] leading-relaxed whitespace-pre-wrap">
                    {item.tweet}
                  </p>
                </div>

                {/* Footer */}
                <div className="px-4 pb-4 flex items-center justify-between gap-3">
                  <a
                    href={item.articleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-[#444] hover:text-[#666] transition-colors truncate"
                  >
                    {new URL(item.articleUrl).hostname.replace("www.", "")}
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(item.tweet)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold bg-black text-white border border-white/[0.12] rounded-lg hover:bg-white/[0.06] transition-colors"
                  >
                    <XLogo size={11} />
                    Post to X
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
