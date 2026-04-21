"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Github,
  Linkedin,
  BrainCircuit,
  Route,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Rss,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { XLogo } from "@/components/XLogo";

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.11, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Home() {
  const { data: session } = useSession();
  const authed = !!session?.user;
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);
  const shouldReduceMotion = mounted ? prefersReducedMotion : false;

  const motionInitial = shouldReduceMotion ? "show" : "hidden";

  return (
    <div className="relative flex flex-col w-full min-h-screen bg-[#090909]">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative w-full min-h-[100vh] overflow-hidden dot-grid">
        {/* Gradient mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[700px] h-[600px] bg-[radial-gradient(ellipse_at_top_left,rgba(212,255,0,0.06)_0%,transparent_60%)]" />
          <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.025)_0%,transparent_60%)]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-transparent to-[#090909]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 pt-20 pb-16">
          <div className="grid lg:grid-cols-[55fr_45fr] gap-12 xl:gap-20 items-center min-h-[calc(100vh-7rem)]">

            {/* Left: Content */}
            <motion.div
              variants={containerVariants}
              initial={motionInitial}
              animate="show"
              className="flex flex-col gap-7"
            >
              {/* Badge */}
              <motion.div variants={itemVariants}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4ff00]/20 bg-[#d4ff00]/[0.05] text-[#d4ff00] text-[11px] font-mono tracking-wide">
                  <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4ff00] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#d4ff00]" />
                  </span>
                  GitHub → LinkedIn &amp; X, in your voice
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={itemVariants}
                className="text-5xl sm:text-6xl lg:text-[4.5rem] xl:text-[5rem] font-extrabold leading-[1.0] tracking-[-0.035em] text-[#f0ede8]"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Turn commits
                <br />
                <span className="text-[#d4ff00]">into content.</span>
              </motion.h1>

              {/* Subhead */}
              <motion.p
                variants={itemVariants}
                className="text-[#525252] text-lg leading-[1.7] max-w-lg font-medium"
              >
                Ship code, not just drafts. Postmate reads your GitHub activity,
                shapes the narrative, and hands you a post you&apos;ll actually
                want to publish.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
                <Link
                  href={authed ? "/dashboard" : "/signin"}
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-[#d4ff00] text-[#090909] font-bold rounded-xl hover:bg-[#c4ef00] transition-colors text-sm"
                >
                  {authed ? "Go to Dashboard" : "Start for Free"}
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-white/[0.08] text-[#666] hover:text-[#f0ede8] hover:border-white/20 rounded-xl transition-all text-sm font-medium"
                >
                  See how it works
                </Link>
              </motion.div>

              {/* Trust note */}
              <motion.p
                variants={itemVariants}
                className="text-[12px] text-[#777] font-mono tracking-wide"
              >
                Read-only GitHub access · No posting without approval · Free forever plan
              </motion.p>
            </motion.div>

            {/* Right: App mock */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, x: 40, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block relative"
            >
              {/* Ambient glow */}
              <div className="absolute -inset-6 bg-[#d4ff00]/[0.03] rounded-3xl blur-3xl pointer-events-none" />

              {/* Mock window */}
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c0c0c] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
                {/* Title bar */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.05] bg-[#0a0a0a]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/70" />
                  <span className="ml-3 text-[11px] font-mono text-[#525252]">
                    postmate — dashboard
                  </span>
                </div>

                {/* Commits list */}
                <div className="p-4 space-y-1.5">
                  <div className="text-[10px] font-mono text-[#555] uppercase tracking-[0.15em] mb-3">
                    Recent commits
                  </div>
                  {[
                    { msg: "fix: resolve token expiry edge case", hash: "a3f2c1" },
                    { msg: "feat: add OAuth2 refresh flow", hash: "b8e4d9" },
                    { msg: "docs: update API reference", hash: "c1f7a2" },
                  ].map((commit, i) => (
                    <motion.div
                      key={i}
                      initial={shouldReduceMotion ? {} : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1, duration: 0.3 }}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#131313] border border-white/[0.04] group hover:border-white/[0.08] transition-colors"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#d4ff00] flex-shrink-0" />
                      <span className="text-[11px] font-mono text-[#606060] flex-1 truncate">
                        {commit.msg}
                      </span>
                      <span className="text-[10px] font-mono text-[#444]">
                        {commit.hash}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* AI divider */}
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="flex-1 h-px bg-white/[0.04]" />
                  <motion.div
                    animate={
                      shouldReduceMotion ? {} : { scale: [1, 1.06, 1] }
                    }
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#d4ff00]/[0.07] border border-[#d4ff00]/20 rounded-full"
                  >
                    <Zap size={9} className="text-[#d4ff00]" />
                    <span className="text-[10px] font-mono text-[#d4ff00]">
                      AI generating
                    </span>
                  </motion.div>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>

                {/* Generated post */}
                <div className="p-4">
                  <div className="text-[10px] font-mono text-[#555] uppercase tracking-[0.15em] mb-3">
                    Generated post · LinkedIn
                  </div>
                  <div className="p-3 rounded-xl bg-[#131313] border border-white/[0.05]">
                    <p className="text-[11px] text-[#808080] leading-relaxed">
                      &ldquo;Just fixed a subtle bug that was silently breaking
                      auth for 12% of users. Here&apos;s what I learned about
                      JWT expiry edge cases...&rdquo;
                    </p>
                    <div className="mt-2.5 flex gap-2 flex-wrap">
                      {["#buildinpublic", "#webdev", "#javascript"].map(
                        (tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-[#d4ff00]/40 font-mono"
                          >
                            {tag}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Link href={authed ? "/dashboard" : "/signin"}>
                      <motion.div
                        initial={shouldReduceMotion ? {} : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="px-3 py-1.5 bg-[#d4ff00] text-[#090909] text-[10px] font-bold rounded-lg cursor-pointer hover:bg-[#c4ef00] transition-colors"
                      >
                        Copy to LinkedIn →
                      </motion.div>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM STRIP ───────────────────────────────── */}
      <section className="w-full py-10 border-y border-white/[0.04] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 flex flex-col sm:flex-row items-center justify-between gap-5">
          <p className="text-[11px] font-mono text-[#666] uppercase tracking-[0.2em] flex-shrink-0">
            Connects with
          </p>
          <div className="flex items-center gap-8 sm:gap-12 opacity-25 hover:opacity-55 transition-opacity duration-500">
            <div className="flex items-center gap-2.5 text-[#f0ede8]">
              <Github size={18} />
              <span className="text-sm font-bold tracking-tight">GitHub</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2.5 text-[#f0ede8]">
              <Linkedin size={18} />
              <span className="text-sm font-bold tracking-tight uppercase">
                LinkedIn
              </span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2.5 text-[#f0ede8]">
              <XLogo size={18} />
              <span className="text-sm font-bold tracking-tight italic">
                X / Twitter
              </span>
            </div>
          </div>
          <div className="hidden sm:block text-[11px] font-mono text-[#666] text-right">
            read-only · no write access
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how-it-works" className="w-full py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16">

          <motion.div
            variants={fadeUp}
            initial={motionInitial}
            whileInView="show"
            viewport={{ once: true, margin: "-5%" }}
            className="mb-20"
          >
            <div className="text-[11px] font-mono text-[#d4ff00]/70 uppercase tracking-[0.2em] mb-5">
              Process
            </div>
            <h2
              className="text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#f0ede8] max-w-xl leading-[1.05]"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Sync, draft, ship.
              <br />
              <span className="text-[#555]">Under 60 seconds.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 relative">
            {/* Dashed connecting line */}
            <div className="hidden md:block absolute top-[2.25rem] left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px border-t border-dashed border-white/[0.06]" />

            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial={motionInitial}
                whileInView="show"
                viewport={{ once: true, margin: "-5%" }}
                transition={{ delay: idx * 0.1 }}
                className="relative p-8 group"
              >
                {/* Faded large number */}
                <div
                  className="text-[96px] font-extrabold leading-none text-white/[0.025] select-none absolute top-4 left-6"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  0{idx + 1}
                </div>

                {/* Step circle */}
                <div className="relative z-10 flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl border border-white/[0.07] bg-[#111] flex items-center justify-center text-xs font-mono text-[#d4ff00] font-bold group-hover:bg-[#d4ff00]/[0.07] group-hover:border-[#d4ff00]/20 transition-all duration-200">
                    {idx + 1}
                  </div>
                </div>

                <h3
                  className="relative z-10 text-[17px] font-bold text-[#f0ede8] mb-2.5 tracking-[-0.01em]"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {step.title}
                </h3>
                <p className="relative z-10 text-sm text-[#666] leading-relaxed font-medium">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="features" className="w-full py-32 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16">

          {/* Asymmetric heading row */}
          <div className="grid lg:grid-cols-[28fr_72fr] gap-10 mb-16 items-end">
            <motion.div
              variants={fadeUp}
              initial={motionInitial}
              whileInView="show"
              viewport={{ once: true }}
            >
              <div className="text-[11px] font-mono text-[#d4ff00]/70 uppercase tracking-[0.2em] mb-5">
                Features
              </div>
              <h2
                className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-[#f0ede8] leading-[1.1]"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Engineered for
                <br />
                momentum.
              </h2>
            </motion.div>
            <motion.p
              variants={fadeUp}
              initial={motionInitial}
              whileInView="show"
              viewport={{ once: true }}
              className="text-[#666] text-lg leading-relaxed font-medium lg:pb-1"
            >
              Stop staring at your commits. AI narration that sounds like you
              — not a corporate press release.
            </motion.p>
          </div>

          {/* Feature grid — staggered columns break symmetry */}
          <div className="grid md:grid-cols-2 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.04]">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial={motionInitial}
                whileInView="show"
                viewport={{ once: true, margin: "-5%" }}
                transition={{ delay: (idx % 2) * 0.08 }}
                className={`group relative p-8 bg-[#090909] hover:bg-[#0d0d0d] transition-colors duration-300 ${
                  idx === 0 ? "md:col-span-2 md:grid md:grid-cols-2 md:gap-0" : ""
                }`}
              >
                {/* Feature index */}
                <div className="absolute top-6 right-7 font-mono text-[10px] text-white/[0.05]">
                  {String(idx + 1).padStart(2, "0")}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#111] border border-white/[0.06] flex items-center justify-center text-[#d4ff00] group-hover:border-[#d4ff00]/20 group-hover:bg-[#d4ff00]/[0.06] transition-all duration-200">
                    {feature.icon}
                  </div>
                  <div>
                    <h3
                      className="text-[16px] font-bold text-[#f0ede8] mb-2 tracking-[-0.01em]"
                      style={{ fontFamily: "var(--font-syne)" }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[#666] leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* First feature spans 2 cols — show visual in 2nd col */}
                {idx === 0 && (
                  <div className="hidden md:flex flex-col justify-center pl-8 border-l border-white/[0.04]">
                    <div className="text-[11px] font-mono text-[#666] uppercase tracking-widest mb-4">
                      Voice profile
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: "Technical", w: "w-full", active: false },
                        { label: "Build in Public", w: "w-full", active: true },
                        { label: "Insight", w: "w-3/4", active: false },
                        { label: "Hype", w: "w-1/2", active: false },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-[#151515] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.active
                                  ? "bg-[#d4ff00]"
                                  : "bg-[#222]"
                              } ${item.w}`}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-mono flex-shrink-0 ${
                              item.active ? "text-[#d4ff00]/60" : "text-[#444]"
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="w-full py-40 border-t border-white/[0.04] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[500px] h-[500px] bg-[#d4ff00]/[0.03] blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
          <div className="max-w-3xl">
            <motion.div
              variants={containerVariants}
              initial={motionInitial}
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-8"
            >
              <motion.div
                variants={itemVariants}
                className="text-[11px] font-mono text-[#d4ff00]/70 uppercase tracking-[0.2em]"
              >
                Ready?
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-0.04em] text-[#f0ede8] leading-[1.0]"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Build in public.
                <br />
                <span className="text-[#444]">Start today.</span>
              </motion.h2>

              <motion.p
                variants={itemVariants}
                className="text-[#444] text-xl leading-relaxed max-w-lg"
              >
                Join developers who ship and share — turning every commit into
                momentum.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-wrap items-center gap-4"
              >
                <Link
                  href={authed ? "/dashboard" : "/signin"}
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-[#d4ff00] text-[#090909] font-bold rounded-xl hover:bg-[#c4ef00] transition-colors text-[15px]"
                >
                  {authed ? "Explore Dashboard" : "Connect with GitHub"}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
                <p className="text-[13px] text-[#777] font-mono">
                  Free forever · Read-only · No card required
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="w-full py-10 border-t border-white/[0.04] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="#d4ff00" />
              <rect x="5" y="7.5" width="12" height="2.5" rx="1.25" fill="#090909" />
              <rect x="5" y="12.75" width="9" height="2.5" rx="1.25" fill="#090909" />
              <rect x="5" y="18" width="6" height="2.5" rx="1.25" fill="#090909" />
              <path d="M22.5 14L18 9.5V18.5L22.5 14Z" fill="#090909" />
            </svg>
            <span
              className="font-bold text-sm tracking-tight text-[#f0ede8]"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Postmate
            </span>
          </div>

          <p className="text-[13px] text-[#666] font-mono">
            © 2026 Postmate. Built for builders.
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: <BrainCircuit size={17} />,
    title: "AI Voice Sync",
    description:
      "Set a voice memory prompt and tone slider — every post sounds like you, not a corporate press release.",
  },
  {
    icon: <Github size={17} />,
    title: "Deep Git Context",
    description:
      "Reads commit messages, file diffs, READMEs, and language stats. Real technical insight, not just subject lines.",
  },
  {
    icon: <Sparkles size={17} />,
    title: "Four Post Styles",
    description:
      "Progress update, technical insight, build-in-public, or full project showcase. One commit, four angles.",
  },
  {
    icon: <Route size={17} />,
    title: "Journey Threads",
    description:
      "Generate a 3-post X thread arc — origin, build, launch — from your repo's full history in one click.",
  },
  {
    icon: <TrendingUp size={17} />,
    title: "Trend Posts",
    description:
      "Tie your work to live tech trends via Google Trends RSS. Generate LinkedIn or X posts anchored to what's hot.",
  },
  {
    icon: <Rss size={17} />,
    title: "News Intelligence",
    description:
      "Ingests 15+ RSS feeds — TechCrunch, Hacker News, Anthropic, OpenAI — and auto-drafts tweets for your review.",
  },
  {
    icon: <ShieldCheck size={17} />,
    title: "Read-Only Security",
    description:
      "OAuth read-only scope. We never write to your repos or post on your behalf. Total control, always.",
  },
];

const steps = [
  {
    title: "Connect Your GitHub",
    description:
      "Grant read-only OAuth access. We pull commit history, READMEs, and language stats — nothing more.",
  },
  {
    title: "Pick a generation mode",
    description:
      "Single commit post, full project showcase, 3-post X journey thread, or a trend-anchored opinion piece.",
  },
  {
    title: "Edit & Ship",
    description:
      "Review the draft in our editor. One click copies to LinkedIn or opens the X composer — done.",
  },
];
