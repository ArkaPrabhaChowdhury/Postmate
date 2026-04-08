"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Github, Linkedin, Twitter } from "lucide-react";

export function HomeHero({ authed }: { authed: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative w-full">
      <div className="relative h-[105vh] min-h-[820px] overflow-hidden bg-zinc-950">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 90% 60% at 50% 8%, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.05) 55%, transparent 72%)",
          }}
        />

        {/* Ambient orbs */}
        <motion.div
          className="absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-[120px]"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 40, 0], y: [0, 20, 0], opacity: [0.5, 0.8, 0.5] }
          }
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 top-32 h-[380px] w-[380px] rounded-full bg-sky-500/15 blur-[120px]"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -30, 0], y: [0, 25, 0], opacity: [0.4, 0.7, 0.4] }
          }
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 w-full px-6 sm:px-8 md:px-12 lg:px-16 pt-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-wide">
              GitHub → LinkedIn/X, in your voice
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
                  See the flow →
                </a>
              )}
            </div>

            <div className="mt-6 text-xs text-zinc-500">
              Read-only GitHub · No LinkedIn API · You stay in control
            </div>
          </div>
        </div>

        {/* Pipeline visual */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 sm:px-8 md:px-12 lg:px-16">
          <div className="relative h-40 w-full">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-indigo-400/70 via-sky-300/60 to-blue-400/70" />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-fuchsia-300/30 via-transparent to-amber-300/30" />

            <motion.div
              className="absolute top-1/2 -translate-y-1/2 h-1 w-40 rounded-full bg-gradient-to-r from-indigo-300 via-sky-300 to-blue-400 blur-[2px]"
              animate={reduceMotion ? undefined : { x: ["-10%", "90%"] }}
              transition={reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: "linear" }}
            />

            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-12">
              <div className="w-24 h-24 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                <Github size={44} className="text-white" />
              </div>
              <div className="w-24 h-24 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center shadow-[0_0_40px_rgba(10,102,194,0.2)]">
                <Linkedin size={44} className="text-[#0A66C2]" />
              </div>
              <div className="w-24 h-24 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center shadow-[0_0_40px_rgba(29,155,240,0.2)]">
                <Twitter size={44} className="text-[#1d9bf0]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
