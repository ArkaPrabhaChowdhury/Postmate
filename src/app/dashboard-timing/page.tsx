import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { getPostingSuggestion } from "@/lib/scoring";
import { getMonthlyPostCount } from "@/lib/plan-limits";

const commitsPerPage = 5;

async function timed<T>(label: string, fn: () => Promise<T>) {
  const startedAt = Date.now();
  const result = await fn();
  return {
    label,
    durationMs: Date.now() - startedAt,
    result,
  };
}

export default async function DashboardTimingPage() {
  const payload = await measureDashboardTiming();

  return (
    <main className="min-h-screen bg-[#090909] p-6 text-[#f0ede8]">
      <pre className="overflow-x-auto whitespace-pre-wrap text-sm">{JSON.stringify(payload, null, 2)}</pre>
    </main>
  );
}

async function measureDashboardTiming() {
  const startedAt = Date.now();
  const userId = await requireUserId();
  const steps: Array<{ label: string; durationMs: number; result: unknown }> = [];

  const activeRepoStep = await timed("activeRepo", () =>
    prisma.repo.findFirst({
      where: { userId, isActive: true },
      select: { id: true, fullName: true },
    })
  );

  steps.push(activeRepoStep);

  if (activeRepoStep.result) {
    const repoId = activeRepoStep.result.id;

    const rest = await Promise.all([
      timed("events", () =>
        prisma.gitHubEvent.findMany({
          where: { repoId, type: "commit" },
          orderBy: { authoredAt: "desc" },
          take: commitsPerPage + 1,
          select: { id: true },
        })
      ),
      timed("posts", () =>
        prisma.generatedPost.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { id: true },
        })
      ),
      timed("strategy", () =>
        prisma.projectStrategy.findFirst({
          where: { userId, repoId },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        })
      ),
      timed("settings", () =>
        prisma.userSettings.findUnique({
          where: { userId },
          select: { userId: true },
        })
      ),
      timed("userState", () =>
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            plan: true,
            proTrialEndsAt: true,
            proTrialExpiredAt: true,
            paddleSubscriptionId: true,
          },
        })
      ),
      timed("suggestion", () => getPostingSuggestion(userId)),
      timed("monthlyPostCount", () => getMonthlyPostCount(userId)),
      timed("scheduledPosts", () =>
        prisma.generatedPost.findMany({
          where: { userId, linkedinStatus: "scheduled" },
          orderBy: { scheduledAt: "asc" },
          select: { id: true },
        })
      ),
      timed("scheduledNews", () =>
        prisma.newsTweet.findMany({
          where: { userId, linkedinStatus: "scheduled" },
          orderBy: { scheduledAt: "asc" },
          select: { id: true },
        })
      ),
    ]);

    steps.push(...rest);
  }

  const payload = {
    ok: !!activeRepoStep.result,
    totalMs: Date.now() - startedAt,
    steps: steps.map(({ label, durationMs, result }) => ({
      label,
      durationMs,
      resultType: result === null ? "null" : Array.isArray(result) ? `array(${result.length})` : typeof result,
    })),
  };
  return payload;
}
