"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, GitCommitHorizontal, Sparkles } from "lucide-react";

type Platform = "linkedin" | "x";

const samples: Record<Platform, string> = {
  linkedin: `I updated the typography and mobile navigation on Postmate's website.\n\nThe change adds Oswald for headings, hides the floating app nav for signed-out visitors, and lets footer links wrap on smaller screens.`,
  x: "Postmate UI update: Oswald for site headings, no floating app nav for signed-out visitors, and footer links that wrap on smaller screens.",
};

export function CommitPostDemo() {
  const [platform, setPlatform] = useState<Platform>("linkedin");

  return (
    <section id="demo" className="w-full border-y border-white/[0.06] bg-[#080a07] px-6 py-20 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#d4ff00]/75">
            Public example
          </p>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-[#f0ede8] sm:text-4xl">
            See what the source supports.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#888]">
            The draft below is based on a real public Postmate commit. The source stays visible so you can check every claim.
          </p>
        </div>

        <div className="grid overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0c0c0c] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-white/[0.08] p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#888]">
              <GitCommitHorizontal size={15} className="text-[#d4ff00]" />
              Source commit
            </div>
            <a
              href="https://github.com/ArkaPrabhaChowdhury/Postmate/commit/d7637e185fc04df8f8e0e7393d2d8537a202c00a"
              target="_blank"
              rel="noreferrer"
              className="group block rounded-xl border border-white/[0.08] bg-[#090909] p-4 transition-colors hover:border-[#d4ff00]/30"
            >
              <span className="mb-2 block font-mono text-[11px] text-[#777]">ArkaPrabhaChowdhury/Postmate · d7637e1</span>
              <span className="block text-sm font-semibold leading-6 text-[#f0ede8]">
                Refresh site typography and mobile navigation behavior
              </span>
              <span className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#d4ff00]">
                Inspect the commit <ExternalLink size={12} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.14em] text-[#555]">Files changed</p>
              <ul className="space-y-2 font-mono text-xs text-[#999]">
                <li>src/app/globals.css</li>
                <li>src/app/layout.tsx</li>
                <li>src/components/MobileNavPill.tsx</li>
              </ul>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#888]">
                <Sparkles size={14} className="text-[#d4ff00]" />
                Example draft
              </div>
              <div role="group" aria-label="Preview format" className="flex gap-1 rounded-lg border border-white/[0.08] bg-black/30 p-1">
                {(["linkedin", "x"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={platform === item}
                    onClick={() => setPlatform(item)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4ff00] ${
                      platform === item ? "bg-[#d4ff00] text-[#090909]" : "text-[#888] hover:text-[#f0ede8]"
                    }`}
                  >
                    {item === "linkedin" ? "LinkedIn" : "X"}
                  </button>
                ))}
              </div>
            </div>
            <div aria-live="polite" className="min-h-48 whitespace-pre-line rounded-xl border border-white/[0.08] bg-[#090909] p-5 text-sm leading-7 text-[#d5d1ca]">
              {samples[platform]}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-[#666]">
              Curated example, not a live AI response. Postmate sends selected commit context to Groq when you generate a draft.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 rounded-xl bg-[#d4ff00] px-5 py-3 text-sm font-bold text-[#090909] transition-colors hover:bg-[#c4ef00]"
              >
                Try it with a public repo <ArrowRight size={15} />
              </Link>
              <Link href="/pricing" className="text-sm font-semibold text-[#888] transition-colors hover:text-[#f0ede8]">
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
