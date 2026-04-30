import { Syne } from "next/font/google";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CreditCard, Clock, HelpCircle, Mail } from "lucide-react";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata = {
  title: "Refund Policy",
  description: "Refund and cancellation policy for Postmate.",
};

export default function RefundPage() {
  const lastUpdated = "April 30, 2026";

  return (
    <div className="min-h-screen bg-[#090909] text-[#f0ede8] selection:bg-[#d4ff00] selection:text-[#090909]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d4ff00]/[0.03] blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#d4ff00]/[0.02] blur-[120px] translate-y-1/2 -translate-x-1/4" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-20 sm:py-32">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#666] hover:text-[#d4ff00] transition-colors mb-12 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <header className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4ff00]/20 bg-[#d4ff00]/[0.05] text-[#d4ff00] text-[11px] font-mono tracking-wide mb-6">
            <RefreshCw size={12} />
            Billing
          </div>
          <h1 className={`text-5xl sm:text-6xl font-extrabold tracking-tight mb-4 ${syne.className}`}>
            Refund <span className="text-[#d4ff00]">Policy</span>
          </h1>
          <p className="text-[#666] font-medium">Last updated: {lastUpdated}</p>
        </header>

        <div className="space-y-16">
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <RefreshCw size={20} />
              </div>
              <h2 className={`text-2xl font-bold ${syne.className}`}>7-Day Refund Guarantee</h2>
            </div>
            <div className="text-[#888] leading-relaxed space-y-4">
              <p>
                If you are not satisfied with Postmate Pro within the first <strong className="text-[#f0ede8]">7 days</strong> of your initial paid subscription, contact us for a full refund — no questions asked.
              </p>
              <p>
                This guarantee applies to first-time Pro subscribers only. It does not apply to renewals or accounts that previously received a refund.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <Clock size={20} />
              </div>
              <h2 className={`text-2xl font-bold ${syne.className}`}>Cancellation</h2>
            </div>
            <div className="text-[#888] leading-relaxed space-y-4">
              <p>
                You may cancel your subscription at any time from your account settings. Cancellation stops future renewals — your Pro access continues until the end of your current billing period.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Monthly plans: cancel any time before the next monthly renewal date.</li>
                <li>Yearly plans: cancel any time before the annual renewal date.</li>
                <li>After cancellation, your account reverts to the Free plan. Your data is not deleted.</li>
              </ul>
              <p>
                Partial-month or partial-year refunds are not issued for mid-cycle cancellations beyond the 7-day window.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <CreditCard size={20} />
              </div>
              <h2 className={`text-2xl font-bold ${syne.className}`}>How Refunds Are Processed</h2>
            </div>
            <div className="text-[#888] leading-relaxed space-y-4">
              <p>
                Approved refunds are processed via the original payment method through Stripe. Processing typically takes 5–10 business days depending on your bank or card issuer.
              </p>
              <p>
                To request a refund, email <a href="mailto:arkopra@gmail.com" className="text-[#888] hover:text-[#d4ff00] transition-colors underline">arkopra@gmail.com</a> with the subject line &quot;Refund Request&quot; and include your account email address. We will process eligible requests within 2 business days.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <HelpCircle size={20} />
              </div>
              <h2 className={`text-2xl font-bold ${syne.className}`}>Free Trials</h2>
            </div>
            <div className="text-[#888] leading-relaxed space-y-4">
              <p>
                When a free trial is offered, no charge is made until the trial period ends. Cancel before the trial ends to avoid being charged. Trial periods are not eligible for the 7-day refund guarantee — if you cancel during the trial, no charge is issued.
              </p>
            </div>
          </section>

          <footer className="pt-16 border-t border-white/[0.05] text-center">
            <div className="flex items-center justify-center gap-2 text-[#555] text-sm">
              <Mail size={14} />
              <span>Refund requests: <a href="mailto:arkopra@gmail.com" className="text-[#888] hover:text-[#d4ff00] transition-colors">arkopra@gmail.com</a></span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
