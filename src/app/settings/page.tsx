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
    <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1
            className="text-xl font-bold tracking-tight text-[#f0ede8]"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Settings
          </h1>
          <p className="text-sm text-[#666] mt-1">
            Select a GitHub repo to sync commits from.
          </p>
        </div>

        {/* Active repo banner */}
        {activeRepo && (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <Check size={14} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-400">Active repo</p>
              <p className="font-mono text-sm font-semibold text-[#f0ede8]">{activeRepo.fullName}</p>
            </div>
          </div>
        )}

        {/* Manual entry */}
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

        {/* Repo list */}
        <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#f0ede8]">Your repositories</h2>
              <p className="text-xs text-[#666] mt-0.5">{ghRepos.length} repos · sorted by activity</p>
            </div>
            <GitBranch size={14} className="text-[#555] flex-shrink-0" />
          </div>

          <div className="divide-y divide-white/[0.05]">
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
                      ${isActive ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "hover:bg-white/[0.03]"}
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold font-mono ${isActive ? "text-emerald-400" : "text-[#f0ede8]"}`}>
                          {r.full_name}
                        </span>
                        {r.private && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#555]">
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
                        <p className="text-xs text-[#666] mt-0.5 truncate max-w-lg">{r.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {r.language && (
                          <span className="flex items-center gap-1.5 text-[11px] text-[#666]">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: langColor ?? "#6b7280" }}
                            />
                            {r.language}
                          </span>
                        )}
                        {r.stargazers_count > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-[#666]">
                            <Star size={10} className="text-[#555]" />
                            {r.stargazers_count.toLocaleString()}
                          </span>
                        )}
                        {r.updated_at && (
                          <span className="text-[11px] text-[#555]">
                            Updated {timeAgo(r.updated_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`
                      flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                      ${isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-white/[0.04] text-[#888] border-white/[0.08] hover:border-white/[0.15]"
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
    </div>
  );
}
