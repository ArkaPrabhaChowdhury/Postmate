import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { generatePostFromCommit, generateStrategyForRepo, syncRecentCommits, generateProjectShowcaseForRepo, generateTrendPostFromRepo, saveVoiceSettings } from "./actions";
import { StrategyJourneyCards, type JourneyPostData } from "@/components/StrategyJourneyCards";
import { getGitHubProfile } from "@/lib/github";
import { fetchDevNews } from "@/lib/news";
import {
  RefreshCw, Sparkles, GitCommit, FileText, Route,
  ExternalLink, ChevronRight, CheckCircle2, ChevronDown,
} from "lucide-react";

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
  build_in_public: { label: "Build", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  project_showcase: { label: "Showcase", cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  trend: { label: "Trend", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
} as const;

const statusConfig = {
  draft: { label: "Draft", cls: "bg-zinc-800 text-zinc-400 border-zinc-700" },
  copied: { label: "Copied", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  posted: { label: "Posted", cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
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
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <GitCommit size={20} className="text-zinc-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight mb-1">No repo connected</h1>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
            Connect a GitHub repo to sync commits and start generating LinkedIn posts.
          </p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Connect a repo
          <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

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

  const [events, posts, strategy, settings] = await Promise.all([
    prisma.gitHubEvent.findMany({
      where: { repoId: activeRepo.id, type: "commit" },
      orderBy: { authoredAt: "desc" },
      take: 20,
      select: { id: true, externalId: true, title: true, url: true, authorLogin: true, authoredAt: true, createdAt: true },
    }),
    prisma.generatedPost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
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
  ]);

  const postBySha = new Map(posts.map((p) => [p.sourceId, p]));

  let journeyPosts: JourneyPostData[] = [];
  if (strategy?.content) {
    try {
      const parsed = JSON.parse(strategy.content);
      if (Array.isArray(parsed)) journeyPosts = parsed as JourneyPostData[];
    } catch { /* ignore */ }
  }

  const profile = await getGitHubProfile(userId);
  const newsHeadlines = await fetchDevNews();
  const rawProfileText = [
    profile.bio,
    profile.company,
    profile.location,
    profile.blog,
    profile.twitter,
  ]
    .filter(Boolean)
    .join(" ");

  const topicPills = rawProfileText
    .split(/[^a-zA-Z0-9#+.-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && t.length < 18)
    .slice(0, 10);

  const fallbackPills = ["DSA", "Web Dev", "AI/ML", "DevOps", "Open Source", "Systems"];

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-zinc-500">Repo:</span>
            <a
              href={`https://github.com/${activeRepo.fullName}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-mono"
            >
              {activeRepo.fullName}
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <form action={syncRecentCommits}>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-300 rounded-lg transition-all">
              <RefreshCw size={12} />
              Sync commits
            </button>
          </form>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-300 rounded-lg transition-all"
          >
            Change repo
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Commits synced", value: events.length, icon: GitCommit },
          { label: "Drafts created", value: posts.length, icon: FileText },
          { label: "Journey posts", value: journeyPosts.length, icon: Route },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Icon size={14} className="text-zinc-400" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight leading-none">{value}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Voice & Tone */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <details>
          <summary className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between gap-4 flex-wrap cursor-pointer select-none">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Voice & Tone</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Save your voice memory and tone preference for all generated posts.
              </p>
            </div>
            <ChevronDown size={14} className="text-zinc-500 chevron" />
          </summary>
          <div className="p-5">
            <form action={saveVoiceSettings} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400">Voice memory</label>
                <textarea
                  name="voiceMemory"
                  defaultValue={settings?.voiceMemory ?? ""}
                  className="mt-2 w-full h-24 resize-y bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 leading-relaxed outline-none focus:border-indigo-500/60"
                  placeholder="Short phrases, tone quirks, or stylistic rules you want in every post."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400">Tone</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    name="tone"
                    min="0"
                    max="100"
                    defaultValue={settings?.tone ?? "50"}
                    className="w-full accent-indigo-500"
                  />
                  <span className="text-xs text-zinc-500 w-24 text-right">
                    {settings?.tone ?? "50"}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-zinc-600">
                  0 = concise · 50 = balanced · 100 = bold
                </div>
              </div>
              <div>
                <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg transition-colors">
                  Save preferences
                </button>
              </div>
            </form>
          </div>
        </details>
      </section>

      {/* Commits */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <details open>
          <summary className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between gap-4 cursor-pointer select-none">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Recent commits</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Select a commit and generate a LinkedIn-ready draft.
              </p>
            </div>
            <ChevronDown size={14} className="text-zinc-500 chevron" />
          </summary>

          {events.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center px-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                <GitCommit size={18} className="text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">No commits synced</p>
                <p className="text-xs text-zinc-600 mt-0.5">Hit "Sync commits" to pull activity from your repo.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {events.map((e) => {
                const existing = postBySha.get(e.externalId);
                return (
                  <div
                    key={e.id}
                    className="px-5 py-3.5 flex items-center gap-4 flex-wrap hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Commit info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">{e.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 flex-wrap">
                        <code className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                          {e.externalId.slice(0, 7)}
                        </code>
                        {e.authorLogin && <span>{e.authorLogin}</span>}
                        {e.authoredAt && <span>{timeAgo(new Date(e.authoredAt))}</span>}
                        {e.url && (
                          <a
                            href={e.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors"
                          >
                            view <ExternalLink size={9} />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
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
                      <form action={generatePostFromCommit} className="flex items-center gap-2">
                        <input type="hidden" name="sha" value={e.externalId} />
                        <select
                          name="style"
                          defaultValue="progress"
                          className="text-[11px] font-medium bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="progress">Progress update</option>
                          <option value="insight">Technical insight</option>
                          <option value="build_in_public">Build in public</option>
                        </select>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors">
                          <Sparkles size={11} />
                          Generate
                        </button>
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
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <details>
          <summary className="px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap cursor-pointer select-none">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">LinkedIn Project Showcase</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                AI reads the entire repo and generates a comprehensive LinkedIn post highlighting key features.
              </p>
            </div>
            <ChevronDown size={14} className="text-zinc-500 chevron" />
          </summary>
          <div className="px-5 py-3.5 border-t border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
            <form action={generateProjectShowcaseForRepo}>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors">
                <Sparkles size={11} />
                Generate showcase
              </button>
            </form>
          </div>
        </details>
      </section>

      {/* Journey */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <details>
          <summary className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between gap-4 flex-wrap cursor-pointer select-none">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">X / Twitter Journey</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                AI reads your repo history and generates 3 posts ideal for an X thread.
              </p>
            </div>
            <ChevronDown size={14} className="text-zinc-500 chevron" />
          </summary>

          <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
            <form action={generateStrategyForRepo}>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg transition-colors">
                <Sparkles size={12} />
                {journeyPosts.length ? "Regenerate" : "Generate journey"}
              </button>
            </form>
          </div>

          {journeyPosts.length > 0 ? (
            <div className="p-5">
              <StrategyJourneyCards posts={journeyPosts} />
              {strategy?.createdAt && (
                <p className="text-[11px] text-zinc-600 mt-3">
                  Generated {timeAgo(new Date(strategy.createdAt))}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-14 text-center px-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                <Route size={18} className="text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">No journey yet</p>
                <p className="text-xs text-zinc-600 mt-0.5 max-w-xs mx-auto">
                  Generate 3 story-arc posts that cover your project from origin to launch.
                </p>
              </div>
            </div>
          )}
        </details>
      </section>

      {/* Trend-based posts */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <details>
          <summary className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between gap-4 flex-wrap cursor-pointer select-none">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Viral Trend Generator</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Create a LinkedIn or X post tied to recent trends and your GitHub profile interests.
              </p>
            </div>
            <ChevronDown size={14} className="text-zinc-500 chevron" />
          </summary>

          <div className="p-5 flex flex-col gap-3">
            <form action={generateTrendPostFromRepo} className="flex items-center gap-2 flex-wrap">
              <select
                name="platform"
                defaultValue="linkedin"
                className="text-[11px] font-medium bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="linkedin">LinkedIn</option>
                <option value="x">X / Twitter</option>
              </select>
              <div className="flex flex-wrap gap-2">
                {(topicPills.length ? topicPills : fallbackPills).map((t) => (
                  <button
                    key={t}
                    name="topic"
                    value={t}
                    className="inline-flex items-center px-3 py-1.5 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-full transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="w-full h-px bg-zinc-800/60 my-1" />
              <div className="flex flex-wrap gap-2">
                {newsHeadlines.map((h) => (
                  <button
                    key={h}
                    name="headline"
                    value={h}
                    className="inline-flex items-center px-3 py-1.5 text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-full transition-colors"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </form>
            <p className="text-[11px] text-zinc-600">
              Pick a topic or a news headline to generate a trend-aligned post draft.
            </p>
          </div>
        </details>
      </section>

      {/* Recent drafts */}
      {posts.length > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <details>
            <summary className="px-5 py-3.5 border-b border-zinc-800 cursor-pointer select-none flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Recent drafts</h2>
              <ChevronDown size={14} className="text-zinc-500 chevron" />
            </summary>
            <div className="divide-y divide-zinc-800/60">
              {posts.map((p) => {
                const sc = styleConfig[p.style as keyof typeof styleConfig] ?? styleConfig.progress;
                const st = statusConfig[p.status as keyof typeof statusConfig] ?? statusConfig.draft;
                return (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge cls={sc.cls}>{sc.label}</Badge>
                      <code className="font-mono text-[11px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {p.repoId && p.sourceId.slice(0, 7) !== p.repoId.slice(0, 7) ? p.sourceId.slice(0, 7) : "repo"}
                      </code>
                      <Badge cls={st.cls}>{st.label}</Badge>
                      <span className="text-[11px] text-zinc-600 hidden sm:block">{timeAgo(new Date(p.createdAt))}</span>
                    </div>
                    <Link
                      href={`/posts/${p.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg transition-all flex-shrink-0"
                    >
                      Edit & post
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
