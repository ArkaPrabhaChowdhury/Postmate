import { prisma } from "./prisma";
import { PLANS, type Plan } from "./plans";
import { expireTrialForUser } from "./trials";

export async function getUserPlan(userId: string): Promise<Plan> {
  await expireTrialForUser(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return (user?.plan ?? "free") as Plan;
}

export async function getMonthlyPostCount(userId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return prisma.generatedPost.count({
    where: { userId, createdAt: { gte: start } },
  });
}

export async function assertCanGeneratePost(userId: string, style: string) {
  const plan = await getUserPlan(userId);
  const limits = PLANS[plan];

  if (plan === "free") {
    if (style !== "progress") {
      throw new Error("UPGRADE_REQUIRED:style");
    }
    const count = await getMonthlyPostCount(userId);
    if (count >= limits.postsPerMonth) {
      throw new Error("UPGRADE_REQUIRED:limit");
    }
  }
}

export async function assertProPlan(userId: string) {
  const plan = await getUserPlan(userId);
  if (plan === "free") {
    throw new Error("UPGRADE_REQUIRED:pro");
  }
}
