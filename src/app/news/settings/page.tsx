import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { saveNewsSettings, flushNews } from "../actions";
import { SendDigestButton } from "./SendDigestButton";

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
              <h2 className="text-sm font-semibold text-[#f0ede8]">News taste profile</h2>
              <p className="text-xs text-[#666] mt-0.5">
                Describe how you want your news tweets to sound. This applies only to news — not your commit posts.
              </p>
            </div>
            <div className="px-5 py-4">
              <textarea
                name="newsTasteProfile"
                defaultValue={settings?.newsTasteProfile ?? ""}
                rows={4}
                placeholder="e.g. Write like a thoughtful senior engineer. Be direct and opinionated. Avoid hype. Use dry wit when relevant. Lead with the technical implication, not the announcement."
                className="w-full bg-[#090909] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-[#f0ede8] placeholder:text-[#444] outline-none focus:border-[#d4ff00]/50 transition-colors resize-none"
              />
            </div>
          </section>

          <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-[#f0ede8]">Your interests</h2>
              <p className="text-xs text-[#666] mt-0.5">
                Companies, topics, or tech stacks you care about — comma-separated. News is filtered and scored around these.
              </p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-2">
              <input
                name="newsKeywords"
                defaultValue={settings?.newsKeywords ?? ""}
                placeholder="e.g. OpenAI, Anthropic, AI agents, React, TypeScript, Rust"
                className="w-full bg-[#090909] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-[#f0ede8] placeholder:text-[#444] outline-none focus:border-[#d4ff00]/50 transition-colors"
              />
              <p className="text-[11px] text-[#555]">
                These are also used to search Hacker News directly — so you get community discussion too, not just press releases.
              </p>
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
                { label: "AI company blogs", desc: "Anthropic, OpenAI, Google AI, DeepMind, Meta AI, Mistral, Hugging Face, Microsoft AI, AWS ML, NVIDIA, Cohere, Stability AI" },
                { label: "Tech news — AI sections", desc: "TechCrunch AI, The Verge AI, VentureBeat AI, Wired AI" },
                { label: "Official dev blogs", desc: "Bun, Deno, Vercel, Cloudflare, GitHub" },
                { label: "Hacker News", desc: "Front page (100+ points) + keyword search on your interests" },
                { label: "GitHub Trending", desc: "Daily trending repos across all languages" },
                { label: "ProductHunt & Lobste.rs", desc: "Developer tool launches and curated community links" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-[#f0ede8]">{s.label}</span>
                  <span className="text-[11px] text-[#555] leading-relaxed">{s.desc}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-white/[0.06]">
              <p className="text-[11px] text-[#444]">
                All items are AI-scored 1–10. Only scores ≥8 reach your queue — major launches, new AI features, and genuinely impactful releases. Minor version bumps and patch releases are filtered out.
              </p>
            </div>
          </section>

          <div>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] text-sm font-bold rounded-xl transition-colors">
              Save settings
            </button>
          </div>
        </form>

        <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-[#f0ede8]">Email digest</h2>
            <p className="text-xs text-[#666] mt-0.5">Send your current pending queue to your account email right now.</p>
          </div>
          <div className="px-5 py-4">
            <SendDigestButton />
          </div>
        </section>

        <form action={flushNews}>
          <section className="bg-[#0c0c0c] border border-red-900/40 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-red-900/30">
              <h2 className="text-sm font-semibold text-red-400">Danger zone</h2>
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-[#f0ede8]">Clear all news</p>
                <p className="text-xs text-[#555] mt-0.5">Deletes your entire queue and seen history. Next fetch starts fresh.</p>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-red-900/40 hover:bg-red-800/60 border border-red-700/40 text-red-400 text-sm font-semibold rounded-xl transition-colors shrink-0"
              >
                Clear queue
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
