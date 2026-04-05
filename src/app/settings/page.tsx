import { requireUserId } from "@/lib/requireUser";
import { getOctokitForUser } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import { setActiveRepo } from "./actions";
import { Lock, Star, GitBranch, Check } from "lucide-react";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", Java: "#b07219", "C++": "#f34b7d",
  Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF", CSS: "#563d7c",
  HTML: "#e34c26", Shell: "#89e051", C: "#555555", "C#": "#178600",
};

export default async function SettingsPage() {
  const userId = await requireUserId();

  const [activeRepo, ghRepos] = await Promise.all([
    prisma.repo.findFirst({ where: { userId, isActive: true }, select: { fullName: true } }),
    (async () => {
      const octokit = await getOctokitForUser(userId);
      const res = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 50,
        sort: "updated",
      });
      return res.data.map((r) => ({
        id: r.id,
        full_name: r.full_name,
        private: r.private,
        description: r.description ?? null,
        language: r.language ?? null,
        stargazers_count: r.stargazers_count ?? 0,
        updated_at: r.updated_at ?? null,
      }));
    })(),
  ]);

  function timeAgo(s: string | null) {
    if (!s) return "";
    const d = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
    if (d === 0) return "today";
    if (d < 30) return `${d}d ago`;
    if (d < 365) return `${Math.floor(d / 30)}mo ago`;
    return `${Math.floor(d / 365)}y ago`;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Select a GitHub repo to sync commits from.
        </p>
      </div>

      {/* Active repo banner */}
      {activeRepo && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <Check size={14} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-400">Active repo</p>
            <p className="font-mono text-sm font-semibold text-zinc-100">{activeRepo.fullName}</p>
          </div>
        </div>
      )}

      {/* Manual entry */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Enter manually</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Paste <code className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-400">owner/repo</code> or a GitHub URL.
          </p>
        </div>
        <div className="px-5 py-4">
          <form action={setActiveRepo} className="flex gap-2 flex-wrap">
            <input
              name="fullName"
              placeholder="e.g. vercel/next.js"
              className="flex-1 min-w-48 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-indigo-500 transition-colors font-mono"
            />
            <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
              Set repo
            </button>
          </form>
        </div>
      </section>

      {/* Repo list */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Your repositories</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{ghRepos.length} repos · sorted by activity</p>
          </div>
          <GitBranch size={14} className="text-zinc-600 flex-shrink-0" />
        </div>

        <div className="divide-y divide-zinc-800/60">
          {ghRepos.map((r) => {
            const isActive = r.full_name === activeRepo?.fullName;
            const langColor = r.language ? (LANG_COLORS[r.language] ?? "#6b7280") : null;

            return (
              <form key={r.id} action={setActiveRepo}>
                <input type="hidden" name="fullName" value={r.full_name} />
                <button
                  type="submit"
                  className={`
                    w-full text-left px-5 py-3.5 flex items-center gap-4
                    transition-colors cursor-pointer
                    ${isActive ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "hover:bg-zinc-800/50"}
                  `}
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold font-mono ${isActive ? "text-emerald-400" : "text-zinc-100"}`}>
                        {r.full_name}
                      </span>
                      {r.private && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600">
                          <Lock size={9} /> Private
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold tracking-wide uppercase">
                          <Check size={9} /> Active
                        </span>
                      )}
                    </div>
                    {r.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-lg">{r.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {r.language && (
                        <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: langColor ?? "#6b7280" }}
                          />
                          {r.language}
                        </span>
                      )}
                      {r.stargazers_count > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <Star size={10} className="text-zinc-600" />
                          {r.stargazers_count.toLocaleString()}
                        </span>
                      )}
                      {r.updated_at && (
                        <span className="text-[11px] text-zinc-600">
                          Updated {timeAgo(r.updated_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Select button */}
                  <div className={`
                    flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                    ${isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700 group-hover:border-zinc-600"
                    }
                  `}>
                    {isActive ? "Selected" : "Use this"}
                  </div>
                </button>
              </form>
            );
          })}
        </div>
      </section>
    </div>
  );
}
