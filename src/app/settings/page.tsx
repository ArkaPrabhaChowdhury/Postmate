import { Suspense } from "react";
import { requireUserId } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { setActiveRepo } from "./actions";
import { getLinkedInAccount } from "@/lib/linkedin";
import { assertPublicRepo } from "@/lib/github";
import { Check, Linkedin, ExternalLink } from "lucide-react";
import BillingSection from "./sections/BillingSection";
import XPostSettingsSection from "./sections/XPostSettingsSection";
import { RepoListSection, RepoListSectionFallback } from "./RepoListSection";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requireUserId();
  const params = (await searchParams) ?? {};
  const repoError = params.repoError === "publicOnly";

  const [storedActiveRepo, linkedinAccount, xSettings, userPlan] = await Promise.all([
    prisma.repo.findFirst({ where: { userId, isActive: true }, select: { fullName: true } }),
    getLinkedInAccount(userId),
    prisma.userSettings.findUnique({ where: { userId }, select: { xEnforce280: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true, paddleSubscriptionId: true } }),
  ]);
  let activeRepo = storedActiveRepo;
  let invalidActiveRepo = false;
  if (storedActiveRepo) {
    const [owner, repo] = storedActiveRepo.fullName.split("/");
    try {
      if (!owner || !repo) throw new Error("Invalid active repository.");
      await assertPublicRepo(owner, repo);
    } catch (error) {
      if (error instanceof Error && error.message.includes("public repositories only")) {
        activeRepo = null;
        invalidActiveRepo = true;
      } else {
        throw error;
      }
    }
  }
  const showRepoError = repoError || invalidActiveRepo;

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
            Connect a public GitHub repo. Private repositories are not supported.
          </p>
        </div>

        {showRepoError && (
          <div role="alert" className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100">
            {invalidActiveRepo
              ? "Your previously selected repo is private or no longer public. Choose a public repository to continue."
              : "That repository is private or could not be found. Postmate currently supports public repositories only."}
          </div>
        )}

        <section className="rounded-xl border border-white/[0.08] bg-[#0c0c0c] px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-sm font-semibold text-[#f0ede8]">GitHub access</h2>
              <p className="mt-1 text-xs leading-5 text-[#888]">
                New sign-ins request profile and email access only. Postmate uses public repository data and makes no GitHub changes.
              </p>
              <p className="mt-2 text-xs leading-5 text-[#666]">
                Older sign-ins may still have GitHub's broad repository permission. Revoke Postmate in GitHub, then sign in again to remove the old grant.
              </p>
            </div>
            <a
              href="https://github.com/settings/applications"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d4ff00] transition-colors hover:text-[#e2ff66]"
            >
              Review GitHub access <ExternalLink size={12} />
            </a>
          </div>
        </section>

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
                <p className="text-sm text-[#666]">Connect LinkedIn to publish a draft or schedule it for a time you choose. X stays manual.</p>
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

        <BillingSection
          isPro={userPlan?.plan === "pro"}
          hasSubscription={!!userPlan?.paddleSubscriptionId}
        />

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
            <h2 className="text-sm font-semibold text-[#f0ede8]">Add a public repository</h2>
            <p className="text-xs text-[#666] mt-0.5">
              Paste a public GitHub URL or{" "}
              <code className="font-mono bg-white/[0.06] px-1 py-0.5 rounded text-[#888]">owner/repo</code>
              .
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
