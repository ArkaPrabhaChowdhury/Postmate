import { Suspense } from "react";
import { requireUserId } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { setActiveRepo } from "./actions";
import { getLinkedInAccount } from "@/lib/linkedin";
import { Check, Linkedin } from "lucide-react";
import BillingSection from "./sections/BillingSection";
import XPostSettingsSection from "./sections/XPostSettingsSection";
import { RepoListSection, RepoListSectionFallback } from "./RepoListSection";

export default async function SettingsPage() {
  const userId = await requireUserId();

  const [activeRepo, linkedinAccount, xSettings, userPlan] = await Promise.all([
    prisma.repo.findFirst({ where: { userId, isActive: true }, select: { fullName: true } }),
    getLinkedInAccount(userId),
    prisma.userSettings.findUnique({ where: { userId }, select: { xEnforce280: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-6 sm:py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight text-[#f0ede8]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Settings
          </h1>
          <p className="text-sm text-[#666] mt-1">
            Select a GitHub repo to sync commits from.
          </p>
        </div>

        <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2">
            <Linkedin size={14} className="text-[#0A66C2]" />
            <h2 className="text-sm font-semibold text-[#f0ede8]">LinkedIn</h2>
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            {linkedinAccount?.access_token ? (
              <>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-sm text-[#f0ede8]">Connected</span>
                  <span className="text-xs text-[#555]">posts go live directly via API</span>
                </div>
                <Link
                  href="/api/auth/linkedin"
                  className="px-3 py-1.5 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-[#888] rounded-lg transition-colors"
                >
                  Reconnect
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-[#666]">Connect LinkedIn to auto-post and schedule directly from Postmate.</p>
                <Link
                  href="/api/auth/linkedin"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg transition-colors"
                >
                  <Linkedin size={13} />
                  Connect LinkedIn
                </Link>
              </>
            )}
          </div>
        </section>

        <BillingSection />

        <XPostSettingsSection
          xEnforce280={xSettings?.xEnforce280 ?? true}
          isPro={userPlan?.plan !== "free"}
        />

        {activeRepo && (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <Check size={14} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-400">Active repo</p>
              <p className="font-mono text-sm font-semibold text-[#f0ede8]">{activeRepo.fullName}</p>
            </div>
          </div>
        )}

        <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-[#f0ede8]">Enter manually</h2>
            <p className="text-xs text-[#666] mt-0.5">
              Paste{" "}
              <code className="font-mono bg-white/[0.06] px-1 py-0.5 rounded text-[#888]">owner/repo</code>
              {" "}or a GitHub URL.
            </p>
          </div>
          <div className="px-5 py-4">
            <form action={setActiveRepo} className="flex gap-2 flex-wrap">
              <input
                name="fullName"
                placeholder="e.g. vercel/next.js"
                className="flex-1 min-w-48 bg-[#090909] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-[#f0ede8] placeholder:text-[#444] outline-none focus:border-[#d4ff00]/50 transition-colors font-mono"
              />
              <button className="px-4 py-2 bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] text-sm font-bold rounded-lg transition-colors whitespace-nowrap">
                Set repo
              </button>
            </form>
          </div>
        </section>

        <Suspense fallback={<RepoListSectionFallback />}>
          <RepoListSection userId={userId} activeFullName={activeRepo?.fullName} />
        </Suspense>
      </div>
    </div>
  );
}
