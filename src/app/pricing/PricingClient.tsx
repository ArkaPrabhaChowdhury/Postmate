"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, ArrowRight, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PLANS } from "@/lib/plans";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

type Plan = "free" | "pro";
type BillingInterval = "monthly" | "yearly";

export default function PricingPage() {
  const { data: session } = useSession();
  const authed = !!session?.user;
  const [loading, setLoading] = useState<Plan | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");

  async function handleUpgrade(plan: Plan) {
    if (plan === "free") return;
    if (!authed) {
      window.location.href = "/signin";
      return;
    }
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingInterval }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function handleStartTrial() {
    if (!authed) {
      window.location.href = "/signin";
      return;
    }

    setTrialLoading(true);
    try {
      const res = await fetch("/api/trial/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start trial");
      window.location.href = "/dashboard?trial=started";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start trial");
    } finally {
      setTrialLoading(false);
    }
  }

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

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-24">

        {/* Header */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="text-center mb-20"
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
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Pick your plan.
            <br />
            <span className="text-[#444]">Ship more content.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-[#555] text-lg max-w-md mx-auto leading-relaxed">
            Start free. Upgrade when your content game needs more firepower.
          </motion.p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="w-full flex justify-center"
        >
          <div className="inline-flex items-center rounded-xl border border-white/[0.08] bg-[#0d0d0d] p-1">
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                billingInterval === "monthly"
                  ? "bg-[#d4ff00] text-[#090909] font-semibold"
                  : "text-[#888] hover:text-[#f0ede8]"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("yearly")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                billingInterval === "yearly"
                  ? "bg-[#d4ff00] text-[#090909] font-semibold"
                  : "text-[#888] hover:text-[#f0ede8]"
              }`}
            >
              Yearly <span className="text-[11px]">(save 20%)</span>
            </button>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="relative max-w-3xl mx-auto mt-10 pt-5">
          {/* Most Popular badge - positioned above the Pro card */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 gap-px bg-white/[0.04] rounded-2xl border border-white/[0.04]"
          >
          {tiers.map(({ key, highlight }) => {
            const plan = PLANS[key];
            const isHighlight = highlight;
            const isFree = key === "free";
            const isLoading = loading === key;
            const shownPrice = isFree
              ? 0
              : billingInterval === "yearly"
                ? plan.yearlyMonthlyEquivalent
                : plan.monthlyPrice;

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
                        Most popular
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
                        fontFamily: "var(--font-syne)",
                        fontVariantNumeric: "lining-nums tabular-nums",
                        fontFeatureSettings: '"lnum" 1, "tnum" 1',
                      }}
                    >
                      ${shownPrice}
                    </span>
                    {!isFree && (
                      <span className="text-[#555] text-sm mb-2 font-mono">/ mo</span>
                    )}
                    {isFree && (
                      <span className="text-[#555] text-sm mb-2 font-mono">forever</span>
                    )}
                  </div>
                  {!isFree && (
                    <div className="h-6 mt-2 text-sm text-[#666]">
                      {billingInterval === "yearly" ? `Billed annually at $${plan.yearlyPrice}/year.` : ""}
                    </div>
                  )}
                </div>

                {/* CTA */}
                {isFree ? (
                  <Link
                    href={authed ? "/dashboard" : "/signin"}
                    className="mb-8 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-[#888] hover:text-[#f0ede8] rounded-xl transition-all text-sm font-semibold"
                  >
                    {authed ? "Current plan" : "Get started free"}
                  </Link>
                ) : (
                  <div className="mb-8 space-y-2">
                    <button
                      onClick={handleStartTrial}
                      disabled={trialLoading || isLoading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] transition-all disabled:opacity-60"
                    >
                      {trialLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          Starting trial...
                        </>
                      ) : (
                        <>
                          Start 3-day free trial
                          <Sparkles size={14} />
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleUpgrade(key)}
                      disabled={isLoading || trialLoading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60 bg-white/[0.07] hover:bg-white/[0.10] border border-white/[0.08] text-[#f0ede8]"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          Upgrade now
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-[#666] text-center">No card needed for the trial. Upgrade anytime to keep Pro.</p>
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
          initial="hidden"
          animate="show"
          className="text-center text-[12px] text-[#444] font-mono mt-10 tracking-wide"
        >
          3-day free trial - No contracts - Cancel anytime - Secure checkout via Stripe
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
            style={{ fontFamily: "var(--font-syne)" }}
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
              <p className="text-sm text-[#555] leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings and you keep access until the end of your billing period. No questions asked.",
  },
  {
    q: "What counts as a post?",
    a: "Any AI-generated draft — LinkedIn post, X tweet, showcase, journey arc, or news tweet. Regenerating the same commit is a new post.",
  },
  {
    q: "Can I upgrade or downgrade mid-cycle?",
    a: "Yes. Stripe prorates immediately. You pay only for what you use.",
  },
  {
    q: "Is my GitHub data safe?",
    a: "Read-only OAuth scope — we never write to your repos. Commit data is stored encrypted and never shared.",
  }
];
