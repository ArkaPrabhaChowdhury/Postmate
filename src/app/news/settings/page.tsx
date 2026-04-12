import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { DEFAULT_KEYWORDS, DEFAULT_SOURCES } from "@/lib/news-rss";
import { saveNewsSettings } from "../actions";

export default async function NewsSettingsPage() {
  const userId = await requireUserId();
  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">News settings</h1>
          <p className="text-xs text-zinc-500 mt-1">Configure RSS sources and keyword filters.</p>
        </div>
        <Link href="/news" className="text-xs text-zinc-400 hover:text-zinc-200">Back to queue →</Link>
      </div>

      <form action={saveNewsSettings} className="grid gap-6">
        <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
          <label className="text-xs font-semibold text-zinc-400">Tweet format</label>
          <select
            name="newsTone"
            defaultValue={settings?.newsTone ?? "mixed"}
            className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500/60"
          >
            <option value="mixed">A/B mixed (question + hot take)</option>
            <option value="question">Questions only</option>
            <option value="hot_take">Hot takes only</option>
          </select>
        </div>

        <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
          <label className="text-xs font-semibold text-zinc-400">RSS sources (one per line)</label>
          <textarea
            name="newsSources"
            defaultValue={settings?.newsSources ?? DEFAULT_SOURCES.join("\n")}
            className="mt-2 w-full h-40 resize-y bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 outline-none focus:border-indigo-500/60"
          />
        </div>

        <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
          <label className="text-xs font-semibold text-zinc-400">Keywords (one per line)</label>
          <textarea
            name="newsKeywords"
            defaultValue={settings?.newsKeywords ?? DEFAULT_KEYWORDS.join("\n")}
            className="mt-2 w-full h-40 resize-y bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 outline-none focus:border-indigo-500/60"
          />
        </div>

        <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
          <label className="text-xs font-semibold text-zinc-400">Exclude topics (one per line)</label>
          <textarea
            name="newsExclude"
            defaultValue={settings?.newsExclude ?? "politics\nwar\nelections"}
            className="mt-2 w-full h-32 resize-y bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 outline-none focus:border-indigo-500/60"
          />
        </div>

        <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="newsAutoFetch"
              value="true"
              defaultChecked={settings?.newsAutoFetch ?? false}
              className="mt-0.5 w-4 h-4 rounded accent-indigo-500 shrink-0"
            />
            <div>
              <span className="text-xs font-semibold text-zinc-300">Auto-fetch news</span>
              <p className="text-xs text-zinc-500 mt-0.5">
                Automatically poll RSS sources every hour via background cron job. Requires Vercel Pro plan for hourly frequency.
              </p>
            </div>
          </label>
        </div>

        <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="newsEmailEnabled"
              value="true"
              defaultChecked={settings?.newsEmailEnabled ?? false}
              className="mt-0.5 w-4 h-4 rounded accent-indigo-500 shrink-0"
            />
            <div>
              <span className="text-xs font-semibold text-zinc-300">Email notifications</span>
              <p className="text-xs text-zinc-500 mt-0.5">
                Get emailed when new articles and tweet drafts arrive. Requires auto-fetch to be enabled and{" "}
                <code className="text-zinc-400 bg-zinc-800 px-1 rounded">RESEND_API_KEY</code> to be configured.
              </p>
            </div>
          </label>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg transition-colors">
          Save settings
        </button>
      </form>
    </div>
  );
}
