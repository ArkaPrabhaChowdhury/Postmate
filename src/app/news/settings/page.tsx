import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { DEFAULT_KEYWORDS, DEFAULT_SOURCES } from "@/lib/news-rss";
import { saveNewsSettings } from "../actions";

export default async function NewsSettingsPage() {
  const userId = await requireUserId();
  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1
              className="text-xl font-bold tracking-tight text-[#f0ede8]"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              News settings
            </h1>
            <p className="text-xs text-[#666] mt-1">Configure RSS sources and keyword filters.</p>
          </div>
          <Link
            href="/news"
            className="text-xs text-[#888] hover:text-[#f0ede8] transition-colors"
          >
            ← Back to queue
          </Link>
        </div>

        <form action={saveNewsSettings} className="grid gap-4">
          <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-[#f0ede8]">Tweet format</h2>
              <p className="text-xs text-[#666] mt-0.5">Choose which tweet styles are generated per article.</p>
            </div>
            <div className="px-5 py-4">
              <select
                name="newsTone"
                defaultValue={settings?.newsTone ?? "mixed"}
                className="w-full bg-[#090909] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-[#f0ede8] outline-none focus:border-[#d4ff00]/50 transition-colors"
              >
                <option value="mixed">A/B mixed (question + hot take)</option>
                <option value="question">Questions only</option>
                <option value="hot_take">Hot takes only</option>
              </select>
            </div>
          </section>

          <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-[#f0ede8]">RSS sources</h2>
              <p className="text-xs text-[#666] mt-0.5">One URL per line. Supports RSS 2.0 and Atom feeds.</p>
            </div>
            <div className="px-5 py-4">
              <textarea
                name="newsSources"
                defaultValue={settings?.newsSources ?? DEFAULT_SOURCES.join("\n")}
                className="w-full h-40 resize-y bg-[#090909] border border-white/[0.08] rounded-xl p-3 text-sm text-[#f0ede8] leading-relaxed outline-none focus:border-[#d4ff00]/50 transition-colors font-mono"
              />
            </div>
          </section>

          <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-[#f0ede8]">Keywords</h2>
              <p className="text-xs text-[#666] mt-0.5">Articles must match at least one keyword to be included.</p>
            </div>
            <div className="px-5 py-4">
              <textarea
                name="newsKeywords"
                defaultValue={settings?.newsKeywords ?? DEFAULT_KEYWORDS.join("\n")}
                className="w-full h-40 resize-y bg-[#090909] border border-white/[0.08] rounded-xl p-3 text-sm text-[#f0ede8] leading-relaxed outline-none focus:border-[#d4ff00]/50 transition-colors font-mono"
              />
            </div>
          </section>

          <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-[#f0ede8]">Exclude topics</h2>
              <p className="text-xs text-[#666] mt-0.5">Articles matching these terms are filtered out.</p>
            </div>
            <div className="px-5 py-4">
              <textarea
                name="newsExclude"
                defaultValue={settings?.newsExclude ?? "politics\nwar\nelections"}
                className="w-full h-32 resize-y bg-[#090909] border border-white/[0.08] rounded-xl p-3 text-sm text-[#f0ede8] leading-relaxed outline-none focus:border-[#d4ff00]/50 transition-colors font-mono"
              />
            </div>
          </section>

          <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-5 py-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="newsAutoFetch"
                  value="true"
                  defaultChecked={settings?.newsAutoFetch ?? false}
                  className="mt-0.5 w-4 h-4 rounded accent-[#d4ff00] shrink-0"
                />
                <div>
                  <span className="text-sm font-semibold text-[#f0ede8]">Auto-fetch news</span>
                  <p className="text-xs text-[#666] mt-0.5">
                    Automatically poll RSS sources once a day at 8 AM UTC via background cron job.
                  </p>
                </div>
              </label>
            </div>
          </section>

          <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-5 py-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="newsEmailEnabled"
                  value="true"
                  defaultChecked={settings?.newsEmailEnabled ?? false}
                  className="mt-0.5 w-4 h-4 rounded accent-[#d4ff00] shrink-0"
                />
                <div>
                  <span className="text-sm font-semibold text-[#f0ede8]">Email notifications</span>
                  <p className="text-xs text-[#666] mt-0.5">
                    Get emailed when new articles and tweet drafts arrive. Requires auto-fetch and{" "}
                    <code className="text-[#888] bg-white/[0.06] px-1 rounded font-mono">RESEND_API_KEY</code>.
                  </p>
                </div>
              </label>
            </div>
          </section>

          <div>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] text-sm font-bold rounded-xl transition-colors">
              Save settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
