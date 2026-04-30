import { Syne } from "next/font/google";
import Link from "next/link";
import { ArrowLeft, FileText, AlertCircle, CreditCard, Ban, Scale, Mail } from "lucide-react";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Postmate.",
};

export default function TermsPage() {
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
            <Scale size={12} />
            Legal
          </div>
          <h1 className={`text-5xl sm:text-6xl font-extrabold tracking-tight mb-4 ${syne.className}`}>
            Terms of <span className="text-[#d4ff00]">Service</span>
          </h1>
          <p className="text-[#666] font-medium">Last updated: {lastUpdated}</p>
        </header>

        <div className="space-y-16">
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <FileText size={20} />
              </div>
              <h2 className={`text-2xl font-bold ${syne.className}`}>Acceptance of Terms</h2>
            </div>
            <div className="text-[#888] leading-relaxed space-y-4">
              <p>
                By accessing or using Postmate (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. These terms apply to all users, including free and paid subscribers.
              </p>
              <p>
                Postmate is operated by Arka Prabha Chowdhury (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We reserve the right to update these terms at any time. Continued use after changes constitutes acceptance.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <FileText size={20} />
              </div>
              <h2 className={`text-2xl font-bold ${syne.className}`}>Description of Service</h2>
            </div>
            <div className="text-[#888] leading-relaxed space-y-4">
              <p>
                Postmate transforms your GitHub commit activity into AI-generated social media posts for LinkedIn and X (Twitter). The Service includes:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>GitHub OAuth integration to read your repositories and commit history</li>
                <li>AI-powered post generation using large language models</li>
                <li>LinkedIn post scheduling and auto-posting</li>
                <li>News tweet generation from curated RSS feeds</li>
                <li>Voice memory and tone personalization</li>
              </ul>
              <p>
                Free accounts are limited to 1 repository and 5 AI-generated posts per month. Pro accounts ($8/month or $60/year) receive unlimited repositories, unlimited posts, and access to all features.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <CreditCard size={20} />
              </div>
              <h2 className={`text-2xl font-bold ${syne.className}`}>Payments & Subscriptions</h2>
            </div>
            <div className="text-[#888] leading-relaxed space-y-4">
              <p>
                Paid subscriptions are billed via Stripe. By subscribing, you authorize recurring charges at the selected interval (monthly or yearly). All prices are in USD.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
                <li>You may cancel at any time from your billing settings. Cancellation takes effect at the end of the current billing period.</li>
                <li>We reserve the right to change pricing with 30 days notice. Price changes apply at your next renewal.</li>
                <li>Free trials, if offered, convert to paid subscriptions unless cancelled before the trial ends.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <AlertCircle size={20} />
              </div>
              <h2 className={`text-2xl font-bold ${syne.className}`}>Acceptable Use</h2>
            </div>
            <div className="text-[#888] leading-relaxed space-y-4">
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Generate content that is defamatory, harassing, or violates third-party rights</li>
                <li>Spam or bulk-post AI-generated content without disclosure where required by platform rules</li>
                <li>Attempt to reverse-engineer, scrape, or abuse the Service&apos;s APIs</li>
                <li>Share account credentials or resell access to the Service</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
              <p>
                You are solely responsible for the content you post to social media using Postmate. We do not review or endorse generated content before it is published.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <Ban size={20} />
              </div>
              <h2 className={`text-2xl font-bold ${syne.className}`}>Disclaimers & Limitation of Liability</h2>
            </div>
            <div className="text-[#888] leading-relaxed space-y-4">
              <p>
                The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that AI-generated content will be accurate, factually correct, or suitable for publication. Always review generated posts before sharing.
              </p>
              <p>
                To the maximum extent permitted by law, Postmate shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including lost revenue, data loss, or reputational harm from published AI-generated content.
              </p>
              <p>
                Our total liability to you shall not exceed the amount you paid for the Service in the 3 months preceding the claim.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <Scale size={20} />
              </div>
              <h2 className={`text-2xl font-bold ${syne.className}`}>Governing Law</h2>
            </div>
            <div className="text-[#888] leading-relaxed">
              <p>
                These Terms are governed by the laws of India. Any disputes shall be resolved through binding arbitration or in courts of competent jurisdiction in India. If any provision of these Terms is found unenforceable, the remaining provisions remain in full effect.
              </p>
            </div>
          </section>

          <footer className="pt-16 border-t border-white/[0.05] text-center">
            <div className="flex items-center justify-center gap-2 text-[#555] text-sm">
              <Mail size={14} />
              <span>Questions? Contact us at <a href="mailto:arkopra@gmail.com" className="text-[#888] hover:text-[#d4ff00] transition-colors">arkopra@gmail.com</a></span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
