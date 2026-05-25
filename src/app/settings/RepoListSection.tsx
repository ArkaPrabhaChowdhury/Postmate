import { GitBranch } from "lucide-react";
import { listUserRepos } from "@/lib/github";
import { RepoListClient } from "./RepoListClient";

export async function RepoListSection({
  userId,
  activeFullName,
}: {
  userId: string;
  activeFullName?: string;
}) {
  const repos = await listUserRepos(userId, { page: 1, perPage: 10 });

  return (
    <RepoListClient
      initialRepos={repos}
      initialHasMore={repos.length === 10}
      activeFullName={activeFullName}
    />
  );
}

export function RepoListSectionFallback() {
  return (
    <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#f0ede8]">Your repositories</h2>
          <p className="text-xs text-[#666] mt-0.5">Loading from GitHub...</p>
        </div>
        <GitBranch size={14} className="text-[#555] flex-shrink-0" />
      </div>

      <div className="divide-y divide-white/[0.05]">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="px-5 py-4">
            <div className="h-4 w-56 rounded bg-white/[0.06]" />
            <div className="mt-2 h-3 w-72 rounded bg-white/[0.04]" />
            <div className="mt-3 h-3 w-36 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </section>
  );
}
