import { prisma } from "@/lib/prisma";

const RECENCY_WEIGHT = 2;
const ACTIVITY_WEIGHT = 3;
const GAP_WEIGHT = 1.5;

const MS_PER_DAY = 86_400_000;

function daysSince(date: Date | null): number {
  if (!date) return 0;
  return Math.floor((Date.now() - date.getTime()) / MS_PER_DAY);
}

export type PostingSuggestion = {
  repoId: string;
  repoFullName: string;
  score: number;
  reasons: string[];
  topCommitSha: string | null;
};

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
  if (!best || best.score === 0) return null;
  return best;
}
