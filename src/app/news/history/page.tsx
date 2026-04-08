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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Posted history</h1>
          <p className="text-xs text-zinc-500 mt-1">Tweets you marked as posted.</p>
        </div>
        <Link href="/news" className="text-xs text-zinc-400 hover:text-zinc-200">Back to queue →</Link>
      </div>

      {posted.length === 0 ? (
        <div className="border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
          No posted tweets yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {posted.map((t) => (
            <div key={t.id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
              <a href={t.articleUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-zinc-100 hover:underline">
                {t.articleTitle}
              </a>
              <div className="text-[11px] text-zinc-500 mt-1">{t.tone}</div>
              <p className="mt-2 text-sm text-zinc-200 whitespace-pre-wrap">{t.tweet}</p>
              {t.postedAt && (
                <div className="mt-2 text-[11px] text-zinc-500">
                  Posted {t.postedAt.toLocaleString("en-US")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
