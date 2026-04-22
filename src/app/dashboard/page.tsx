import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { generatePostFromCommit, generateStrategyForRepo, generateProjectShowcaseForRepo, saveVoiceSettings, autoGenerateVoice, generateClusteredPostsAction, generateSuggestedPost } from "./actions";
import { getPostingSuggestion } from "@/lib/scoring";
import { StrategyJourneyCards, type JourneyPostData } from "@/components/StrategyJourneyCards";
import { VoiceSettingsSection } from "@/components/VoiceSettingsSection";
import { getOctokitForUser } from "@/lib/github";
import {
  Sparkles, GitCommit, FileText, Route,
  ExternalLink, ChevronRight, CheckCircle2, ChevronDown, Fingerprint, Layers, Zap, Lock,
} from "lucide-react";
import { getUserPlan, getMonthlyPostCount } from "@/lib/plan-limits";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { StopPropagation } from "@/components/StopPropagation";

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

const styleConfig = {
  progress: { label: "Progress", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  insight: { label: "Insight", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  build_in_public: { label: "Build", cls: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  project_showcase: { label: "Showcase", cls: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  trend: { label: "Trend", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
} as const;

const statusConfig = {
  draft: { label: "Draft", cls: "bg-white/[0.06] text-[#888] border-white/[0.1]" },
  copied: { label: "Copied", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  posted: { label: "Posted", cls: "bg-[#d4ff00]/10 text-[#d4ff00] border-[#d4ff00]/20" },
} as const;

function Badge({ children, cls }: { children: React.ReactNode; cls: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold tracking-wide uppercase ${cls}`}>
      {children}
    </span>
  );
}

export default async function DashboardPage() {
  const userId = await requireUserId();
  const activeRepo = await prisma.repo.findFirst({
    where: { userId, isActive: true },
    select: { id: true, fullName: true },
  });

  if (!activeRepo) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#0c0c0c] border border-white/[0.08] flex items-center justify-center">
          <GitCommit size={20} className="text-[#555]" />
        </div>
        <div>
          <h1
            className="text-xl font-bold tracking-tight text-[#f0ede8] mb-1"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            No repo connected
          </h1>
          <p className="text-sm text-[#666] max-w-xs mx-auto leading-relaxed">
            Connect a GitHub repo to sync commits and start generating posts.
          </p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] text-sm font-bold rounded-xl transition-colors"
        >
          Connect a repo
          <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

  // Auto-sync commits on every page load
  try {
    const [owner, name] = activeRepo.fullName.split("/");
    const octokit = await getOctokitForUser(userId);
    const res = await octokit.rest.repos.listCommits({ owner, repo: name, per_page: 20 });
    for (const c of res.data) {
      const message = c.commit?.message ?? "";
      const authoredAt = c.commit?.author?.date ?? null;
      const authorLogin = c.author?.login ?? null;
      const row = {
        repoId: activeRepo.id,
        type: "commit",
        externalId: c.sha,
        title: message.split(/\r?\n/)[0]?.trim() ?? message,
        url: c.html_url ?? null,
        authorLogin,
        authoredAt: authoredAt ? new Date(authoredAt) : null,
        payloadJson: JSON.stringify({ sha: c.sha, message, html_url: c.html_url, authoredAt, authorLogin }),
      };
      await prisma.gitHubEvent.upsert({
        where: { repoId_type_externalId: { repoId: row.repoId, type: row.type, externalId: row.externalId } },
        create: row,
        update: { title: row.title, url: row.url, authorLogin: row.authorLogin, authoredAt: row.authoredAt, payloadJson: row.payloadJson },
      });
    }
  } catch { /* silent fail — stale data still renders */ }

  const strategyModel = (prisma as unknown as {
    projectStrategy?: {
      findFirst: (args: {
        where: { userId: string; repoId: string };
        orderBy: { createdAt: "desc" };
        select: { id: true; content: true; createdAt: true };
      }) => Promise<{ id: string; content: string; createdAt: Date } | null>;
    };
  }).projectStrategy;

  const settingsClient = prisma as unknown as {
    userSettings?: {
      findUnique: (args: { where: { userId: string } }) => Promise<{ voiceMemory?: string | null; tone?: string | null } | null>;
    };
  };

  const [events, posts, strategy, settings, suggestion, plan, monthlyPostCount] = await Promise.all([
    prisma.gitHubEvent.findMany({
      where: { repoId: activeRepo.id, type: "commit" },
      orderBy: { authoredAt: "desc" },
      take: 5,
      select: { id: true, externalId: true, title: true, url: true, authorLogin: true, authoredAt: true, createdAt: true },
    }),
    prisma.generatedPost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, repoId: true, sourceId: true, style: true, status: true, createdAt: true },
    }),
    strategyModel
      ? strategyModel.findFirst({
        where: { userId, repoId: activeRepo.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, content: true, createdAt: true },
      })
      : Promise.resolve(null),
    settingsClient.userSettings ? settingsClient.userSettings.findUnique({ where: { userId } }) : Promise.resolve(null),
    getPostingSuggestion(userId),
    getUserPlan(userId),
    getMonthlyPostCount(userId),
  ]);

  const isPro = plan === "pro";
  const freePostsLeft = Math.max(0, 5 - monthlyPostCount);

  const postBySha = new Map(posts.map((p) => [p.sourceId, p]));

  let journeyPosts: JourneyPostData[] = [];
  if (strategy?.content) {
    try {
      const parsed = JSON.parse(strategy.content);
      if (Array.isArray(parsed)) journeyPosts = parsed as JourneyPostData[];
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-xl font-bold tracking-tight text-[#f0ede8]"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#555]">Repo:</span>
              <a
                href={`https://github.com/${activeRepo.fullName}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#d4ff00]/70 hover:text-[#d4ff00] transition-colors flex items-center gap-1 font-mono"
              >
                {activeRepo.fullName}
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-[#888] rounded-lg transition-all"
          >
            Change repo
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Commits synced", value: events.length, icon: GitCommit },
            { label: "Drafts created", value: posts.length, icon: FileText },
            { label: "Journey posts", value: journeyPosts.length, icon: Route },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-[#d4ff00]/60" />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight leading-none text-[#f0ede8]">{value}</div>
                <div className="text-[11px] text-[#555] mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Free plan usage banner */}
        {!isPro && (
          <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-[#0c0c0c] border border-white/[0.08] rounded-xl flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                <Zap size={14} className="text-[#d4ff00]/60" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#f0ede8]">Free plan — {freePostsLeft} post{freePostsLeft !== 1 ? "s" : ""} left this month</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 h-1 bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#d4ff00] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (monthlyPostCount / 5) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#555]">{monthlyPostCount} / 5</span>
                </div>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
            >
              <Sparkles size={11} />
              Upgrade to Pro
            </Link>
          </div>
        )}

        {/* Suggested today */}
        {suggestion && suggestion.topCommitSha && (
          <div className="bg-[#0c0c0c] border border-[#d4ff00]/20 rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#d4ff00]/10 border border-[#d4ff00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={14} className="text-[#d4ff00]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#d4ff00] uppercase tracking-wider mb-0.5">Suggested today</p>
                <p className="text-sm font-medium text-[#f0ede8]">{suggestion.repoFullName}</p>
                <p className="text-xs text-[#666] mt-0.5">{suggestion.reasons.join(" · ")}</p>
              </div>
            </div>
            <form action={generateSuggestedPost}>
              <input type="hidden" name="commitSha" value={suggestion.topCommitSha} />
              <input type="hidden" name="repoId" value={suggestion.repoId} />
              <SubmitButton
                pendingText="Generating…"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                <Sparkles size={11} />
                Generate post
              </SubmitButton>
            </form>
          </div>
        )}

        {/* Voice & Tone */}
        <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
          <details>
            <summary className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-4 flex-wrap cursor-pointer select-none">
              <div>
                <h2 className="text-sm font-semibold text-[#f0ede8]">Voice &amp; Tone</h2>
                <p className="text-xs text-[#666] mt-0.5">
                  Save your voice memory and tone preference for all generated posts.
                </p>
              </div>
              <ChevronDown size={14} className="text-[#555] chevron" />
            </summary>
            <div className="p-5">
              <VoiceSettingsSection
                initialVoiceMemory={settings?.voiceMemory ?? ""}
                initialTone={settings?.tone ?? "50"}
                onSave={saveVoiceSettings}
                onAutoGenerate={autoGenerateVoice}
              />
            </div>
          </details>
        </section>

        {/* Commits */}
        <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
          <details open>
            <summary className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-4 cursor-pointer select-none">
              <div>
                <h2 className="text-sm font-semibold text-[#f0ede8]">Recent commits</h2>
                <p className="text-xs text-[#666] mt-0.5">
                  Select a commit and generate a LinkedIn-ready draft.
                </p>
              </div>
              <StopPropagation>
                {isPro ? (
                  <form action={generateClusteredPostsAction} className="flex items-center gap-2">
                    <div className="relative">
                      <select
                        name="platform"
                        defaultValue="linkedin"
                        className="text-[11px] font-medium bg-[#090909] border border-white/[0.1] text-[#aaa] rounded-lg pl-2 pr-6 py-1.5 outline-none focus:border-[#d4ff00]/50 cursor-pointer appearance-none"
                      >
                        <option value="linkedin">LinkedIn</option>
                        <option value="x">X / Twitter</option>
                      </select>
                      <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#666]" />
                    </div>
                    <SubmitButton
                      pendingText="Clustering…"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] rounded-lg transition-colors disabled:opacity-60"
                    >
                      <Layers size={11} />
                      Cluster commits
                    </SubmitButton>
                  </form>
                ) : (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white/[0.05] border border-white/[0.08] text-[#555] rounded-lg hover:border-[#d4ff00]/30 hover:text-[#d4ff00] transition-colors"
                  >
                    <Lock size={10} />
                    Cluster commits · Pro
                  </Link>
                )}
              </StopPropagation>
              <ChevronDown size={14} className="text-[#555] chevron" />
            </summary>

            {events.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center px-6">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <GitCommit size={18} className="text-[#444]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#888]">No commits synced</p>
                  <p className="text-xs text-[#555] mt-0.5">Hit &ldquo;Sync commits&rdquo; to pull activity from your repo.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {events.map((e) => {
                  const existing = postBySha.get(e.externalId);
                  return (
                    <div
                      key={e.id}
                      className="px-5 py-3.5 flex items-center gap-4 flex-wrap hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#f0ede8] truncate">{e.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#555] flex-wrap">
                          <code className="font-mono bg-white/[0.05] px-1.5 py-0.5 rounded text-[#888]">
                            {e.externalId.slice(0, 7)}
                          </code>
                          {e.authorLogin && <span>{e.authorLogin}</span>}
                          {e.authoredAt && <span>{timeAgo(new Date(e.authoredAt))}</span>}
                          {e.url && (
                            <a
                              href={e.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#d4ff00]/60 hover:text-[#d4ff00] flex items-center gap-0.5 transition-colors"
                            >
                              view <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        {existing && (
                          <Link
                            href={`/posts/${existing.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                          >
                            <CheckCircle2 size={11} />
                            Draft exists
                          </Link>
                        )}
                        <form action={generatePostFromCommit} className="flex items-center gap-2 flex-wrap">
                          <input type="hidden" name="sha" value={e.externalId} />
                          <div className="relative">
                            <select
                              name="platform"
                              defaultValue="linkedin"
                              className="text-[11px] font-medium bg-[#090909] border border-white/[0.1] text-[#aaa] rounded-lg pl-2 pr-6 py-1.5 outline-none focus:border-[#d4ff00]/50 cursor-pointer appearance-none"
                            >
                              <option value="linkedin">LinkedIn</option>
                              <option value="x">X / Twitter</option>
                            </select>
                            <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#666]" />
                          </div>
                          <div className="relative">
                            <select
                              name="style"
                              defaultValue="progress"
                              disabled={!isPro}
                              className="text-[11px] font-medium bg-[#090909] border border-white/[0.1] text-[#aaa] rounded-lg pl-2 pr-6 py-1.5 outline-none focus:border-[#d4ff00]/50 cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="progress">Progress update</option>
                              {isPro && <option value="insight">Technical insight</option>}
                              {isPro && <option value="build_in_public">Build in public</option>}
                            </select>
                            <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#666]" />
                          </div>
                          {!isPro && freePostsLeft === 0 ? (
                            <Link href="/pricing" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] rounded-lg transition-colors whitespace-nowrap">
                              <Lock size={11} /> Limit reached
                            </Link>
                          ) : (
                            <SubmitButton
                              pendingText="Generating…"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] rounded-lg transition-colors disabled:opacity-60"
                            >
                              <Sparkles size={11} />
                              Generate
                            </SubmitButton>
                          )}
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </details>
        </section>

        {/* Project Showcase */}
        <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
          <details>
            <summary className="px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-[#f0ede8] flex items-center gap-2">
                    LinkedIn Project Showcase
                    {!isPro && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#d4ff00]/10 text-[#d4ff00] border border-[#d4ff00]/20 rounded text-[9px] font-bold tracking-wide uppercase"><Lock size={8} /> Pro</span>}
                  </h2>
                  <p className="text-xs text-[#666] mt-0.5">
                    AI reads the entire repo and generates a comprehensive LinkedIn post highlighting key features.
                  </p>
                </div>
              </div>
              <ChevronDown size={14} className="text-[#555] chevron" />
            </summary>
            <div className="px-5 py-3.5 border-t border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
              {isPro ? (
                <form action={generateProjectShowcaseForRepo}>
                  <SubmitButton
                    pendingText="Generating…"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] rounded-lg transition-colors disabled:opacity-60"
                  >
                    <Sparkles size={11} />
                    Generate showcase
                  </SubmitButton>
                </form>
              ) : (
                <Link href="/pricing" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] rounded-lg transition-colors">
                  <Sparkles size={11} /> Upgrade to Pro
                </Link>
              )}
            </div>
          </details>
        </section>

        {/* Journey */}
        <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
          <details>
            <summary className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-4 flex-wrap cursor-pointer select-none">
              <div>
                <h2 className="text-sm font-semibold text-[#f0ede8] flex items-center gap-2">
                  Journey Posts for X
                  {!isPro && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#d4ff00]/10 text-[#d4ff00] border border-[#d4ff00]/20 rounded text-[9px] font-bold tracking-wide uppercase"><Lock size={8} /> Pro</span>}
                </h2>
                <p className="text-xs text-[#666] mt-0.5">
                  AI reads your repo history and generates 3 posts ideal for an X thread.
                </p>
              </div>
              <ChevronDown size={14} className="text-[#555] chevron" />
            </summary>

            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
              {isPro ? (
                <form action={generateStrategyForRepo}>
                  <SubmitButton
                    pendingText="Generating…"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-[#aaa] rounded-lg transition-colors disabled:opacity-60"
                  >
                    <Sparkles size={12} />
                    {journeyPosts.length ? "Regenerate" : "Generate journey"}
                  </SubmitButton>
                </form>
              ) : (
                <Link href="/pricing" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] rounded-lg transition-colors">
                  <Sparkles size={11} /> Upgrade to Pro
                </Link>
              )}
            </div>

            {journeyPosts.length > 0 ? (
              <div className="p-5">
                <StrategyJourneyCards posts={journeyPosts} />
                {strategy?.createdAt && (
                  <p className="text-[11px] text-[#555] mt-3">
                    Generated {timeAgo(new Date(strategy.createdAt))}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-14 text-center px-6">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <Route size={18} className="text-[#444]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#888]">No journey yet</p>
                  <p className="text-xs text-[#555] mt-0.5 max-w-xs mx-auto">
                    Generate 3 story-arc posts covering your project from origin to launch.
                  </p>
                </div>
              </div>
            )}
          </details>
        </section>

        {/* Recent drafts */}
        {posts.length > 0 && (
          <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
            <details>
              <summary className="px-5 py-3.5 border-b border-white/[0.06] cursor-pointer select-none flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#f0ede8]">Recent drafts</h2>
                <ChevronDown size={14} className="text-[#555] chevron" />
              </summary>
              <div className="divide-y divide-white/[0.05]">
                {posts.map((p) => {
                  const sc = styleConfig[p.style as keyof typeof styleConfig] ?? styleConfig.progress;
                  const st = statusConfig[p.status as keyof typeof statusConfig] ?? statusConfig.draft;
                  return (
                    <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge cls={sc.cls}>{sc.label}</Badge>
                        <code className="font-mono text-[11px] text-[#666] bg-white/[0.05] px-1.5 py-0.5 rounded">
                          {p.repoId && p.sourceId.slice(0, 7) !== p.repoId.slice(0, 7) ? p.sourceId.slice(0, 7) : "repo"}
                        </code>
                        <Badge cls={st.cls}>{st.label}</Badge>
                        <span className="text-[11px] text-[#555] hidden sm:block">{timeAgo(new Date(p.createdAt))}</span>
                      </div>
                      <Link
                        href={`/posts/${p.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-[#888] rounded-lg transition-all flex-shrink-0"
                      >
                        Edit &amp; post
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </details>
          </section>
        )}
      </div>
    </div>
  );
}
