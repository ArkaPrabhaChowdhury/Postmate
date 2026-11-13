import { SignInButton } from "@/components/AuthButtons";
import { Shield, Lock, EyeOff } from "lucide-react";
import Link from "next/link";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const callbackUrl = params.callbackUrl === "/pricing?upgrade=pro"
    ? "/pricing?upgrade=pro"
    : "/dashboard";
  const isUpgradeFlow = callbackUrl === "/pricing?upgrade=pro";

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
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {isUpgradeFlow ? "Continue to Postmate Pro" : "Sign in to Postmate"}
        </h1>
        <p className="text-sm text-[#888] leading-relaxed mb-8">
          {isUpgradeFlow
            ? "Sign in to return to secure checkout. You will see the final price before paying."
            : "Pick a public repository and turn one commit into a LinkedIn or X draft you can edit."}
        </p>

        <SignInButton callbackUrl={callbackUrl} />

        {/* Trust Signals */}
        <div className="mt-8 flex flex-col gap-3">
          {[
            { icon: EyeOff, text: "Public repositories only" },
            { icon: Lock, text: "Postmate never changes your GitHub" },
            { icon: Shield, text: "Review every draft before sharing" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-2 text-xs font-medium text-[#666]">
              <Icon size={14} className="text-[#d4ff00]/60" />
              {text}
            </div>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-[#555] mt-6">
          GitHub sign-in asks for profile and email access.{" "}
          <Link href="/privacy" className="text-[#777] underline underline-offset-2 hover:text-[#d4ff00]">How data is used</Link>.
        </p>
      </div>
    </div>
  );
}
