import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";

export default async function NewsHistoryPage() {
  const userId = await requireUserId();

  const posted = await prisma.newsTweet.findMany({
    where: { userId, status: "posted" },
    orderBy: { postedAt: "desc" },
    take: 100,
    select: { id: true, articleUrl: true, articleTitle: true, tone: true, tweet: true, postedAt: true },
  });

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1
              className="text-xl font-bold tracking-tight text-[#f0ede8]"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Posted history
            </h1>
            <p className="text-xs text-[#666] mt-1">Tweets you marked as posted.</p>
          </div>
          <Link
            href="/news"
            className="text-xs text-[#888] hover:text-[#f0ede8] transition-colors"
          >
            ← Back to queue
          </Link>
        </div>

        {posted.length === 0 ? (
          <div className="border border-white/[0.08] rounded-xl p-8 text-center text-[#555]">
            No posted tweets yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {posted.map((t) => (
              <div key={t.id} className="border border-white/[0.08] rounded-xl p-5 bg-[#0c0c0c]">
                <a
                  href={t.articleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-[#f0ede8] hover:underline"
                >
                  {t.articleTitle}
                </a>
                <div className="text-[11px] font-mono tracking-wide uppercase text-[#555] mt-1">
                  {t.tone}
                </div>
                <p className="mt-2 text-sm text-[#aaa] leading-relaxed whitespace-pre-wrap">
                  {t.tweet}
                </p>
                {t.postedAt && (
                  <div className="mt-2 text-[11px] text-[#555] font-mono">
                    Posted {t.postedAt.toLocaleString("en-US")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
