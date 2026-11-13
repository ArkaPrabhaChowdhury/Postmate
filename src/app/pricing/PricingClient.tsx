"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, ArrowRight, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { captureAnalyticsEvent } from "@/components/AppAnalytics";
import { ANALYTICS_EVENTS } from "@/lib/analytics";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

type Plan = "free" | "pro";

export default function PricingPage({ countryCode, isPro }: { countryCode: string; isPro: boolean }) {
  const { data: session } = useSession();
  const authed = !!session?.user;
  const [loading, setLoading] = useState<Plan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const proPrice = countryCode === "IN" ? `₹${PLANS.pro.indiaPrice}` : `$${PLANS.pro.price}`;

  useEffect(() => {
    captureAnalyticsEvent(ANALYTICS_EVENTS.pricingViewed, {
      entrypoint: authed ? "authenticated" : "anonymous",
    });
  }, [authed]);

  const handleUpgrade = useCallback(async (plan: Plan) => {
    if (plan === "free" || isPro) return;
    captureAnalyticsEvent(ANALYTICS_EVENTS.pricingPlanSelected, {
      plan,
      authed,
      action: "one_time_purchase",
    });
    if (!authed) {
      window.location.href = "/signin?callbackUrl=" + encodeURIComponent("/pricing?upgrade=pro");
      return;
    }
    setLoading(plan);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/paddle/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setCheckoutError(data.error || "Could not start checkout. Please try again.");
    } catch {
      setCheckoutError("Could not start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  }, [authed, isPro]);

  const resumedUpgrade = useRef(false);
  useEffect(() => {
    const shouldResume = new URLSearchParams(window.location.search).get("upgrade") === "pro";
    if (!authed || isPro || !shouldResume || resumedUpgrade.current) return;
    resumedUpgrade.current = true;
    window.history.replaceState(window.history.state, "", "/pricing");
    void handleUpgrade("pro");
  }, [authed, handleUpgrade, isPro]);

  const tiers: { key: Plan; highlight?: boolean }[] = [
    { key: "free" },
    { key: "pro", highlight: true },
  ];

  return (
    <div className="relative min-h-screen bg-[#090909]">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(212,255,0,0.04)_0%,transparent_65%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-16">

        {/* Header */}
        <motion.div
          variants={stagger}
          className="text-center mb-10"
        >
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4ff00]/20 bg-[#d4ff00]/[0.05] text-[#d4ff00] text-[11px] font-mono tracking-wide mb-6">
              <Sparkles size={10} />
              Simple, transparent pricing
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl font-extrabold tracking-[-0.035em] text-[#f0ede8] leading-[1.05] mb-5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Pick your plan.
            <br />
            <span className="text-[#444]">Ship more content.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-[#555] text-lg max-w-md mx-auto leading-relaxed">
            5 drafts a month are free. Upgrade once for unlimited drafts.
          </motion.p>
        </motion.div>

        {/* Pricing cards */}
        <div className="relative max-w-3xl mx-auto">
          <motion.div
            variants={stagger}
            className="grid md:grid-cols-2 gap-px bg-white/[0.04] rounded-2xl border border-white/[0.04]"
          >
          {tiers.map(({ key, highlight }) => {
            const plan = PLANS[key];
            const isHighlight = highlight;
            const isFree = key === "free";
            const isLoading = loading === key;
            return (
              <motion.div
                key={key}
                variants={fadeUp}
                className={`relative flex flex-col p-8 ${isHighlight ? "bg-[#0d0d0d]" : "bg-[#090909]"}`}
              >
                {isHighlight && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4ff00]/40 to-transparent" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d4ff00] text-[#090909] text-[10px] font-bold rounded-full tracking-wide uppercase shadow-lg">
                        <Zap size={9} />
                        One-time access
                      </div>
                    </div>
                  </>
                )}

                {/* Plan name + price */}
                <div className="mb-6 min-h-[108px]">
                  <div className="text-[11px] font-mono text-[#555] uppercase tracking-[0.2em] mb-3">
                    {plan.name}
                  </div>
                  <div className="flex items-end gap-1.5">
                    <span
                      className="text-5xl font-extrabold text-[#f0ede8] tracking-tight"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontVariantNumeric: "lining-nums tabular-nums",
                        fontFeatureSettings: '"lnum" 1, "tnum" 1',
                      }}
                    >
                      {isFree ? "$0" : proPrice}
                    </span>
                    {!isFree && (
                      <span className="text-[#555] text-sm mb-2 font-mono">one time</span>
                    )}
                    {isFree && (
                      <span className="text-[#555] text-sm mb-2 font-mono">forever</span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                {isFree ? (
                  <Link
                    href={authed || isPro ? "/dashboard" : "/signin"}
                    className="mb-8 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-[#888] hover:text-[#f0ede8] rounded-xl transition-all text-sm font-semibold"
                  >
                    {isPro ? "Go to dashboard" : authed ? "Current plan" : "Get started free"}
                  </Link>
                ) : (
                  <div className="mb-8">
                    <button
                      onClick={() => handleUpgrade(key)}
                      disabled={isLoading || isPro}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909]"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          {isPro ? "Pro is active" : "Get Pro once"}
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                    {checkoutError && (
                      <p role="alert" className="mt-2 text-xs text-red-400 text-center">
                        {checkoutError}
                      </p>
                    )}
                    <p className="mt-3 text-center text-[11px] text-[#666]">
                      7-day refund guarantee ·{" "}
                      <Link href="/refund" className="text-[#888] underline underline-offset-2 hover:text-[#d4ff00]">
                        See policy
                      </Link>
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div className="h-px bg-white/[0.05] mb-6" />

                {/* Features */}
                <ul className="flex flex-col gap-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        size={13}
                        className={`flex-shrink-0 mt-0.5 ${isHighlight ? "text-[#d4ff00]" : "text-[#444]"}`}
                      />
                      <span className="text-[13px] text-[#888] leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
        </div>

        {/* Bottom note */}
        <motion.p
          variants={fadeUp}
          className="text-center text-[12px] text-[#444] font-mono mt-10 tracking-wide"
        >
          One payment · Lifetime Pro access · No renewals · Secure checkout via Paddle
        </motion.p>

        {/* FAQ section */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-28 max-w-2xl mx-auto"
        >
          <motion.h2
            variants={fadeUp}
            className="text-2xl font-extrabold text-[#f0ede8] tracking-tight mb-10 text-center"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Frequently asked
          </motion.h2>

          {faqs.map((faq) => (
            <motion.div
              key={faq.q}
              variants={fadeUp}
              className="border-b border-white/[0.05] py-5"
            >
              <p className="text-sm font-semibold text-[#f0ede8] mb-2">{faq.q}</p>
              <p className="text-sm text-[#555] leading-relaxed">
                {faq.a}{" "}
                {faq.href && (
                  <Link href={faq.href} className="text-[#888] underline underline-offset-2 hover:text-[#d4ff00]">
                    {faq.linkLabel}
                  </Link>
                )}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

const faqs = [
  {
    q: "Is Pro a subscription?",
    a: "New Pro purchases are one-time with lifetime access and no renewals. Existing legacy subscriptions keep their current billing terms until canceled.",
  },
  {
    q: "What counts as a post?",
    a: "Each new draft uses one monthly slot. Editing or regenerating the same saved draft does not use another slot.",
  },
  {
    q: "What happens after I pay?",
    a: "Paddle confirms your payment and Pro features are enabled on your account.",
  },
  {
    q: "What does Postmate send to AI?",
    a: "When you generate a draft, the selected commit context is sent to Groq for processing. Postmate works with public repositories only.",
    href: "/privacy",
    linkLabel: "Read the privacy policy.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes. First-time Pro purchases are covered by a 7-day refund guarantee.",
    href: "/refund",
    linkLabel: "Read the refund policy.",
  },
];
