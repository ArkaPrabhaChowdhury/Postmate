import { prisma } from "@/lib/prisma";

const RECENCY_WEIGHT = 2;
const ACTIVITY_WEIGHT = 3;
const GAP_WEIGHT = 1.5;

const MS_PER_DAY = 86_400_000;

function daysSince(date: Date | null, fallback = 30): number {
  if (!date) return fallback;
  return Math.floor((Date.now() - date.getTime()) / MS_PER_DAY);
}

export type PostingSuggestion = {
  repoId: string;
  repoFullName: string;
  score: number;
  reasons: string[];
  topCommitSha: string | null;
};

export type WeeklyDigestCommit = {
  sha: string;
  title: string;
  authoredAt: Date | null;
  url: string | null;
  score: number;
  reasons: string[];
  hasDraft: boolean;
};

export type WeeklyShippingDigest = {
  totalCommits: number;
  worthPostingCount: number;
  worthPosting: WeeklyDigestCommit[];
};

const LOW_SIGNAL_PREFIXES = [
  "merge",
  "chore",
  "docs",
  "bump",
  "typo",
  "wip",
  "refactor",
  "test",
];

const HIGH_SIGNAL_KEYWORDS = [
  "feat",
  "fix",
  "ship",
  "launch",
  "release",
  "improve",
  "perf",
  "ai",
  "auth",
  "billing",
  "dashboard",
  "api",
  "automation",
  "integration",
];

export async function getPostingSuggestion(userId: string): Promise<PostingSuggestion | null> {
  const repos = await prisma.repo.findMany({
    where: { userId },
    select: { id: true, fullName: true },
  });
  if (repos.length === 0) return null;

  const now = Date.now();
  const weekAgo = new Date(now - 7 * MS_PER_DAY);

  const scored = await Promise.all(
    repos.map(async (repo) => {
      const [lastPost, commitsThisWeek, lastRepoPost, topCommit] = await Promise.all([
        prisma.generatedPost.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
        prisma.gitHubEvent.count({
          where: { repoId: repo.id, type: "commit", authoredAt: { gte: weekAgo } },
        }),
        prisma.generatedPost.findFirst({
          where: { userId, repoId: repo.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
        prisma.gitHubEvent.findFirst({
          where: { repoId: repo.id, type: "commit" },
          orderBy: { authoredAt: "desc" },
          select: { externalId: true },
        }),
      ]);

      const daysSinceLastPost = daysSince(lastPost?.createdAt ?? null);
      const daysSinceRepoMentioned = daysSince(lastRepoPost?.createdAt ?? null);

      const score =
        RECENCY_WEIGHT * daysSinceLastPost +
        ACTIVITY_WEIGHT * commitsThisWeek +
        GAP_WEIGHT * daysSinceRepoMentioned;

      const reasons: string[] = [];
      if (commitsThisWeek > 0) reasons.push(`${commitsThisWeek} commit${commitsThisWeek > 1 ? "s" : ""} this week`);
      if (daysSinceRepoMentioned > 0) reasons.push(`no post about this repo in ${daysSinceRepoMentioned}d`);
      if (daysSinceLastPost > 0) reasons.push(`last post ${daysSinceLastPost}d ago`);

      return {
        repoId: repo.id,
        repoFullName: repo.fullName,
        score,
        reasons,
        topCommitSha: topCommit?.externalId ?? null,
      };
    })
  );

  const best = scored.sort((a, b) => b.score - a.score)[0];
  if (!best || !best.topCommitSha) return null;
  return best;
}

export async function getWeeklyShippingDigest(userId: string, repoId: string): Promise<WeeklyShippingDigest> {
  const weekAgo = new Date(Date.now() - 7 * MS_PER_DAY);
  const commits = await prisma.gitHubEvent.findMany({
    where: { repoId, type: "commit", authoredAt: { gte: weekAgo } },
    orderBy: { authoredAt: "desc" },
    select: { externalId: true, title: true, authoredAt: true, url: true },
    take: 120,
  });

  if (commits.length === 0) {
    return { totalCommits: 0, worthPostingCount: 0, worthPosting: [] };
  }

  const draftedShas = await prisma.generatedPost.findMany({
    where: {
      userId,
      sourceType: "commit",
      sourceId: { in: commits.map((c) => c.externalId) },
    },
    select: { sourceId: true },
  });
  const draftedSet = new Set(draftedShas.map((p) => p.sourceId));

  const scored = commits.map((commit): WeeklyDigestCommit => {
    const normalized = commit.title.trim().toLowerCase();
    const hasDraft = draftedSet.has(commit.externalId);
    let score = 0;
    const reasons: string[] = [];

    if (!LOW_SIGNAL_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
      score += 2;
      reasons.push("substantive update");
    }
    if (HIGH_SIGNAL_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
      score += 2;
      reasons.push("high-impact keyword");
    }
    if (commit.title.length > 42) {
      score += 1;
      reasons.push("specific commit context");
    }
    if (hasDraft) {
      score -= 3;
      reasons.push("already drafted");
    }

    return {
      sha: commit.externalId,
      title: commit.title,
      authoredAt: commit.authoredAt,
      url: commit.url,
      score,
      reasons,
      hasDraft,
    };
  });

  const worthPosting = scored
    .filter((c) => !c.hasDraft && c.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    totalCommits: commits.length,
    worthPostingCount: worthPosting.length,
    worthPosting,
  };
}
