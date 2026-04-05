import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ArrowRight, GitCommit, Sparkles, Zap, Linkedin, Twitter } from "lucide-react";
import { GoogleGeminiEffectDemo } from "@/components/google-gemini-effect-demo";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const authed = !!session?.user;

  return (
    <div className="flex flex-col gap-24 pb-20">
      {/* Hero (Full Bleed) */}
      <section className="relative -mx-5 sm:-mx-8 md:-mx-12 lg:-mx-16">
        <div className="relative h-[120vh] min-h-[900px] bg-zinc-950 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 60% at 50% 10%, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0.02) 55%, transparent 70%)",
            }}
          />

          <div className="absolute inset-0">
            <GoogleGeminiEffectDemo />
          </div>

          <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 md:px-12 lg:px-16 pt-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-wide">
                <Zap size={11} className="fill-indigo-400" />
                GitHub -> LinkedIn/X, in your voice
              </div>

              <h1 className="mt-5 text-5xl sm:text-6xl font-bold tracking-tight leading-[1.02]">
                From commits to posts,
                <br />
                <span className="text-indigo-400">without the blank page.</span>
              </h1>

              <p className="mt-5 text-zinc-300 text-lg leading-relaxed max-w-xl">
                Watch your GitHub activity flow into LinkedIn and X. We pull the signal,
                shape the narrative, and hand you a draft you can ship.
              </p>

              <div className="mt-6 flex items-center gap-3">
                <Link
                  href={authed ? "/dashboard" : "/signin"}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {authed ? "Go to dashboard" : "Get started free"}
                  <ArrowRight size={15} />
                </Link>
                {!authed && (
                  <a href="#flow" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                    See the flow ->
                  </a>
                )}
              </div>

              <div className="mt-6 flex items-center gap-6 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-2">
                  <GitCommit size={14} className="text-indigo-400" />
                  Read-only GitHub
                </span>
                <span className="inline-flex items-center gap-2">
                  <Linkedin size={14} className="text-[#0A66C2]" />
                  LinkedIn drafts
                </span>
                <span className="inline-flex items-center gap-2">
                  <Twitter size={14} className="text-[#1d9bf0]" />
                  X-ready posts
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flow */}
      <section id="flow" className="max-w-5xl mx-auto w-full px-5 sm:px-8 md:px-12 lg:px-16">
        <div className="flex flex-col gap-10">
          <div>
            <p className="text-xs font-semibold text-indigo-400 tracking-widest uppercase mb-3">The flow</p>
            <h2 className="text-3xl font-bold tracking-tight">GitHub -> narrative -> post</h2>
            <p className="mt-3 text-zinc-400 max-w-2xl">
              The animation above mirrors the pipeline: commits become signal, signal becomes a draft,
              and drafts become LinkedIn or X posts.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-10 text-sm text-zinc-300">
            <div className="border-t border-zinc-800 pt-5">
              <div className="text-xs text-zinc-500 mb-2">01</div>
              <div className="font-semibold text-zinc-100 mb-2">Capture the signal</div>
              <p className="text-zinc-500">Commits, README, and repo context are parsed into clean prompts.</p>
            </div>
            <div className="border-t border-zinc-800 pt-5">
              <div className="text-xs text-zinc-500 mb-2">02</div>
              <div className="font-semibold text-zinc-100 mb-2">Shape the narrative</div>
              <p className="text-zinc-500">Tone, voice memory, and constraints keep the draft personal and real.</p>
            </div>
            <div className="border-t border-zinc-800 pt-5">
              <div className="text-xs text-zinc-500 mb-2">03</div>
              <div className="font-semibold text-zinc-100 mb-2">Ship it</div>
              <p className="text-zinc-500">Copy to LinkedIn or X with a single click and keep momentum.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Depth */}
      <section className="max-w-5xl mx-auto w-full px-5 sm:px-8 md:px-12 lg:px-16">
        <div className="flex flex-col gap-10">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-indigo-400 tracking-widest uppercase mb-3">Built for daily use</p>
              <h2 className="text-3xl font-bold tracking-tight">Drafts that sound like you</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <Sparkles size={14} className="text-indigo-400" />
              Voice memory · Tone slider · Trend prompts
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10 text-sm">
            <div className="border-t border-zinc-800 pt-5">
              <div className="font-semibold text-zinc-100 mb-2">Voice memory</div>
              <p className="text-zinc-500">
                Save the phrases and rules that sound like you. Every draft uses them automatically.
              </p>
            </div>
            <div className="border-t border-zinc-800 pt-5">
              <div className="font-semibold text-zinc-100 mb-2">Trend + news prompts</div>
              <p className="text-zinc-500">
                Post about what is happening now without sounding like a PR team.
              </p>
            </div>
            <div className="border-t border-zinc-800 pt-5">
              <div className="font-semibold text-zinc-100 mb-2">LinkedIn + X formats</div>
              <p className="text-zinc-500">
                One engine, two platforms. Long-form for LinkedIn, sharp cuts for X.
              </p>
            </div>
            <div className="border-t border-zinc-800 pt-5">
              <div className="font-semibold text-zinc-100 mb-2">Read-only by default</div>
              <p className="text-zinc-500">
                We never push code or post for you. You keep full control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!authed && (
        <section className="max-w-3xl mx-auto w-full px-5 sm:px-8 md:px-12 lg:px-16">
          <div className="border border-indigo-500/30 rounded-2xl p-10 text-center bg-gradient-to-br from-indigo-950/50 to-zinc-950">
            <h2 className="text-2xl font-bold tracking-tight mb-3">Start posting like you ship</h2>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Connect your GitHub once. The rest is a daily habit.
            </p>
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Get started free
              <ArrowRight size={15} />
            </Link>
            <p className="mt-3 text-xs text-zinc-600">
              GitHub OAuth · Read-only · No credit card
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
