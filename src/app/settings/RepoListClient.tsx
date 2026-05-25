"use client";

import { useState } from "react";
import { Lock, Star, GitBranch, Check } from "lucide-react";
import { setActiveRepo } from "./actions";
import type { GitHubRepoListItem } from "@/lib/github";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", Java: "#b07219", "C++": "#f34b7d",
  Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF", CSS: "#563d7c",
  HTML: "#e34c26", Shell: "#89e051", C: "#555555", "C#": "#178600",
};

function timeAgo(s: string | null) {
  if (!s) return "";
  const date = new Date(s);
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function RepoRow({
  repo,
  activeFullName,
}: {
  repo: GitHubRepoListItem;
  activeFullName?: string;
}) {
  const isActive = repo.full_name === activeFullName;
  const langColor = repo.language ? (LANG_COLORS[repo.language] ?? "#6b7280") : null;

  return (
    <form action={setActiveRepo}>
      <input type="hidden" name="fullName" value={repo.full_name} />
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
              {repo.full_name}
            </span>
            {repo.private && (
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
          {repo.description && (
            <p className="text-xs text-[#666] mt-0.5 truncate max-w-lg">{repo.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            {repo.language && (
              <span className="flex items-center gap-1.5 text-[11px] text-[#666]">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: langColor ?? "#6b7280" }}
                />
                {repo.language}
              </span>
            )}
            {repo.stargazers_count > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-[#666]">
                <Star size={10} className="text-[#555]" />
                {repo.stargazers_count.toLocaleString()}
              </span>
            )}
            {repo.updated_at && (
              <span className="text-[11px] text-[#555]">
                Updated {timeAgo(repo.updated_at)}
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
          {isActive ? "Selected" : "Use repo"}
        </div>
      </button>
    </form>
  );
}

export function RepoListClient({
  initialRepos,
  activeFullName,
  initialHasMore,
}: {
  initialRepos: GitHubRepoListItem[];
  activeFullName?: string;
  initialHasMore: boolean;
}) {
  const [repos, setRepos] = useState(initialRepos);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/github/repos?page=${nextPage}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load repositories");
      }

      const data = await res.json() as {
        repos: GitHubRepoListItem[];
        hasMore: boolean;
        page: number;
      };

      setRepos((current) => [...current, ...data.repos]);
      setPage(data.page);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#f0ede8]">Your repositories</h2>
          <p className="text-xs text-[#666] mt-0.5">Showing {repos.length} repos</p>
        </div>
        <GitBranch size={14} className="text-[#555] flex-shrink-0" />
      </div>

      <div className="divide-y divide-white/[0.05]">
        {repos.map((repo) => (
          <RepoRow key={repo.id} repo={repo} activeFullName={activeFullName} />
        ))}
      </div>

      {hasMore && (
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-[#f0ede8] text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </section>
  );
}
