import { Syne } from "next/font/google";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, FileText, Globe } from "lucide-react";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata = {
  title: "Privacy Policy",
  description: "How we handle your data at Postmate.",
};

export default function PrivacyPage() {
  const lastUpdated = "April 22, 2026";

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
          <h1 
            className={`text-5xl sm:text-6xl font-extrabold tracking-tight mb-4 ${syne.className}`}
          >
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
              <h2 className={`text-2xl font-bold ${syne.className}`}>Information We Collect</h2>
            </div>
            <div className="prose prose-invert max-w-none text-[#888] leading-relaxed space-y-4">
              <p>
                We collect information to provide better services to all our users. The information we collect includes:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#f0ede8]">Account Information:</strong> When you sign in via GitHub, we receive your GitHub username, email address, and profile picture.
                </li>
                <li>
                  <strong className="text-[#f0ede8]">GitHub Data:</strong> To generate posts, we request read-only access to your public and private repositories. We only read commit messages, file diffs, and project metadata.
                </li>
                <li>
                  <strong className="text-[#f0ede8]">Usage Data:</strong> We collect information about how you use our application, such as the number of posts generated and your preferred settings.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <Lock size={20} />
              </div>
              <h2 className={`text-2xl font-bold ${syne.className}`}>How We Use Data</h2>
            </div>
            <div className="prose prose-invert max-w-none text-[#888] leading-relaxed space-y-4">
              <p>
                Your data is used exclusively to provide and improve the Postmate experience:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>To authenticate your identity and link your GitHub repositories.</li>
                <li>To generate high-quality social media content based on your technical activity.</li>
                <li>To provide personalized AI voice profiles and tone adjustments.</li>
                <li>We do <strong className="text-[#f0ede8]">not</strong> sell your data to third parties.</li>
                <li>We do <strong className="text-[#f0ede8]">not</strong> train shared AI models on your private repository data.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <Globe size={20} />
              </div>
              <h2 className={`text-2xl font-bold ${syne.className}`}>Third Party Services</h2>
            </div>
            <div className="prose prose-invert max-w-none text-[#888] leading-relaxed space-y-4">
              <p>
                We use industry-standard third-party services to power certain features:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-[#f0ede8]">GitHub:</strong> For authentication and repository access.</li>
                <li><strong className="text-[#f0ede8]">Groq:</strong> For lightning-fast content generation. Data sent for processing is minimized and anonymized where possible.</li>
                <li><strong className="text-[#f0ede8]">Vercel:</strong> For hosting and infrastructure.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d4ff00]">
                <FileText size={20} />
              </div>
              <h2 className={`text-2xl font-bold ${syne.className}`}>Security</h2>
            </div>
            <div className="prose prose-invert max-w-none text-[#888] leading-relaxed">
              <p>
                We prioritize the security of your data. We use industry-standard encryption for data at rest and in transit. Your GitHub OAuth tokens are encrypted before storage and are never exposed. We requested the minimum necessary permissions (read-only) to ensure your repositories remain safe.
              </p>
            </div>
          </section>

          {/* Footer of the page */}
          <footer className="pt-16 border-t border-white/[0.05] text-center">
            <p className="text-[#555] text-sm">
              If you have any questions about this Privacy Policy, please contact us at support@postmate.dev
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
