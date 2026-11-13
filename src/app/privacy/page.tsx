import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, FileText, Globe } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description: "How we handle your data at Postmate.",
};

export default function PrivacyPage() {
  const lastUpdated = "November 13, 2026";

  return (
    <div className="min-h-screen bg-[#090909] text-[#f0ede8] selection:bg-[#d4ff00] selection:text-[#090909]">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d4ff00]/[0.03] blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#d4ff00]/[0.02] blur-[120px] translate-y-1/2 -translate-x-1/4" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-20 sm:py-32">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#666] hover:text-[#d4ff00] transition-colors mb-12 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Header */}
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4ff00]/20 bg-[#d4ff00]/[0.05] text-[#d4ff00] text-[11px] font-mono tracking-wide mb-6">
            <Shield size={12} />
            Data Protection
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4">
            Privacy <span className="text-[#d4ff00]">Policy</span>
          </h1>
          <p className="text-[#666] font-medium">
            Last updated: {lastUpdated}
          </p>
        </header>

        {/* Content */}
        <div className="space-y-16">
          {/* Section 1 */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <Eye size={20} />
              </div>
              <h2 className="text-2xl font-bold">Information We Collect</h2>
            </div>
            <div className="prose prose-invert max-w-none text-[#888] leading-relaxed space-y-4">
              <p>
                Postmate uses the following information to provide the app:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#f0ede8]">Account Information:</strong> When you sign in via GitHub, we receive your GitHub username, email address, and profile picture.
                </li>
                <li>
                  <strong className="text-[#f0ede8]">Public GitHub Data:</strong> Postmate supports public repositories only. It reads repository metadata, commit messages, changed file names, available diffs, and README content for project features.
                </li>
                <li>
                  <strong className="text-[#f0ede8]">App Data:</strong> We store generated drafts, selected repositories, settings such as saved voice and tone, and usage records needed to provide the service.
                </li>
                <li>
                  <strong className="text-[#f0ede8]">Analytics:</strong> PostHog and Microsoft Clarity may process visits, referral sources, product interactions, and session recordings to measure usage and improve the app.
                </li>
              </ul>
              <p>
                New GitHub sign-ins request profile and email access. Postmate checks that a repository is public before using it. If you authorized the older version, its stored GitHub token may still have the broader <code>repo</code> permission until you revoke Postmate in your <a href="https://github.com/settings/applications" target="_blank" rel="noreferrer" className="text-[#d4ff00] underline">GitHub application settings</a> and sign in again.
              </p>
              <p>
                If an older version synced a private repository, previously saved commit records or drafts may remain in your account. This update stops private repositories from appearing in the dashboard. Email <a href="mailto:arkopra@gmail.com" className="text-[#d4ff00] underline">arkopra@gmail.com</a> to request removal of historical data.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <Lock size={20} />
              </div>
              <h2 className="text-2xl font-bold">How We Use Data</h2>
            </div>
            <div className="prose prose-invert max-w-none text-[#888] leading-relaxed space-y-4">
              <p>
                We use your data to operate Postmate:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>To authenticate your identity and link your GitHub repositories.</li>
                <li>To sync public repository activity and generate, save, and score drafts you request.</li>
                <li>To apply your saved voice preferences and any extra instructions you enter.</li>
                <li>When you generate content, the selected commit context is sent to Groq for processing. Project features can also send public repository metadata, README excerpts, and recent commit context.</li>
                <li>We do not sell your personal information.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <Globe size={20} />
              </div>
              <h2 className="text-2xl font-bold">Third Party Services</h2>
            </div>
            <div className="prose prose-invert max-w-none text-[#888] leading-relaxed space-y-4">
              <p>
                These providers process data as needed to provide the features:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-[#f0ede8]">GitHub:</strong> For sign-in and public repository data.</li>
                <li><strong className="text-[#f0ede8]">Groq:</strong> For AI draft generation. Groq says inference inputs and outputs are not retained by default, but may be temporarily logged for reliability or abuse investigations for up to 30 days. Postmate does not claim that zero data retention is enabled. <a href="https://console.groq.com/docs/your-data" target="_blank" rel="noreferrer" className="text-[#d4ff00] underline">Groq data handling details</a>.</li>
                <li><strong className="text-[#f0ede8]">LinkedIn:</strong> Draft content is sent to LinkedIn only when you choose to publish or schedule it.</li>
                <li><strong className="text-[#f0ede8]">PostHog and Microsoft Clarity:</strong> For product analytics, heatmaps, and session recordings.</li>
                <li><strong className="text-[#f0ede8]">Paddle:</strong> To process purchases and related billing information.</li>
                <li><strong className="text-[#f0ede8]">Resend:</strong> To send account, digest, and trial-related emails.</li>
                <li><strong className="text-[#f0ede8]">Vercel:</strong> For hosting and infrastructure.</li>
              </ul>
              <p>Groq's service agreement says it does not use inputs or outputs to train models unless the customer explicitly permits or instructs it.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <FileText size={20} />
              </div>
              <h2 className="text-2xl font-bold">Security</h2>
            </div>
            <div className="prose prose-invert max-w-none text-[#888] leading-relaxed">
              <p>
                Newly linked GitHub OAuth tokens are encrypted before storage. Older plaintext tokens are encrypted the first time Postmate uses them for a GitHub API request. Tokens are decrypted on the server only when needed. New sign-ins request profile and email access; the app only uses public repositories and does not make changes to them. Older authorizations may retain broader permissions until revoked in GitHub settings.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <FileText size={20} />
              </div>
              <h2 className="text-2xl font-bold">AI draft accuracy</h2>
            </div>
            <div className="prose prose-invert max-w-none text-[#888] leading-relaxed">
              <p>
                AI drafts can be inaccurate or include details that are not supported by the source. Check every draft before sharing it. Postmate does not publish to LinkedIn unless you choose to publish or schedule a draft; X publishing is manual.
              </p>
            </div>
          </section>

          {/* Footer of the page */}
          <footer className="pt-16 border-t border-white/[0.05] text-center">
            <p className="text-[#555] text-sm">
              Questions or data removal requests:{" "}
              <a href="mailto:arkopra@gmail.com" className="text-[#888] hover:text-[#d4ff00] underline">arkopra@gmail.com</a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
