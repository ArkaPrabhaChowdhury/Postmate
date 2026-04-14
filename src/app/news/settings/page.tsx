import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
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
            <p className="text-xs text-[#666] mt-1">
              Postmate monitors GitHub releases, trending repos, HN top posts, and official AI lab blogs.
              Items are AI-scored for developer relevance — only high-signal updates reach your queue.
            </p>
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
            <div className="px-5 py-4 flex flex-col gap-4">
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
                    Poll sources once a day at 8 AM UTC via background cron. Only high-signal items reach the queue.
                  </p>
                </div>
              </label>

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
                    Get emailed when new high-signal articles arrive. Sent to your GitHub account email.
                    Requires auto-fetch and{" "}
                    <code className="text-[#888] bg-white/[0.06] px-1 rounded font-mono">RESEND_API_KEY</code>.
                  </p>
                </div>
              </label>
            </div>
          </section>

          <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-[#f0ede8]">What's monitored</h2>
            </div>
            <div className="px-5 py-4 grid gap-3 sm:grid-cols-2">
              {[
                { label: "GitHub releases", desc: "Bun, Deno, Node, React, Next.js, TypeScript, Vite, Rust, uv, Ruff, Tailwind, Prisma, Biome, Astro, Zed, Tauri, Ollama, llama.cpp, and more" },
                { label: "Official blogs", desc: "Bun, Deno, Vercel, Cloudflare, GitHub, Anthropic, OpenAI, Google DeepMind" },
                { label: "Hacker News top posts", desc: "Items with 100+ points on the front page, plus high-voted Show HN and Ask HN" },
                { label: "GitHub Trending", desc: "Daily trending repositories across all languages" },
                { label: "ProductHunt", desc: "Top developer tools launches" },
                { label: "Lobste.rs", desc: "Curated tech links from the developer community" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-[#f0ede8]">{s.label}</span>
                  <span className="text-[11px] text-[#555] leading-relaxed">{s.desc}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-white/[0.06]">
              <p className="text-[11px] text-[#444]">
                All items are AI-scored 1–10. Only items scoring ≥7 ("concrete release, viral tool, or major AI launch") reach your queue.
              </p>
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
