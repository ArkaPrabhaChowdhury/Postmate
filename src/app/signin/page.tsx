import { SignInButton } from "@/components/AuthButtons";
import { Shield, Lock, EyeOff } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="max-w-sm mx-auto mt-24 px-4">
      <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-3xl p-8 text-center shadow-[0_32px_80px_rgba(0,0,0,0.6)]">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "#d4ff00" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="5" y="7.5" width="12" height="2.5" rx="1.25" fill="#090909" />
              <rect x="5" y="12.75" width="9" height="2.5" rx="1.25" fill="#090909" />
              <rect x="5" y="18" width="6" height="2.5" rx="1.25" fill="#090909" />
              <path d="M22.5 14L18 9.5V18.5L22.5 14Z" fill="#090909" />
            </svg>
          </div>
        </div>

        <h1
          className="text-2xl font-bold tracking-tight text-[#f0ede8] mb-2"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Sign in to Postmate
        </h1>
        <p className="text-sm text-[#888] leading-relaxed mb-8">
          Connect your GitHub account to start turning your commits into LinkedIn &amp; X posts.
        </p>

        <SignInButton />

        {/* Trust Signals */}
        <div className="mt-8 flex flex-col gap-3">
          {[
            { icon: EyeOff, text: "Read-only access to your repos" },
            { icon: Lock, text: "We never commit code or post for you" },
            { icon: Shield, text: "No LinkedIn or X API required" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-2 text-xs font-medium text-[#666]">
              <Icon size={14} className="text-[#d4ff00]/60" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
