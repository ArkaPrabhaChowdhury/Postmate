import { prisma } from "@/lib/prisma";
import { sendTrialExpiredEmail } from "@/lib/email";

const TRIAL_DAYS = 3;

export async function startProTrial(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, proTrialStartedAt: true, paddleSubscriptionId: true },
  });

  if (!user) throw new Error("User not found");
  if (user.plan === "pro" && user.paddleSubscriptionId) throw new Error("Already subscribed to Pro");
  if (user.proTrialStartedAt) throw new Error("Trial already used");

  const now = new Date();
  const endsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  return prisma.user.update({
    where: { id: userId },
    data: {
      plan: "pro",
      proTrialStartedAt: now,
      proTrialEndsAt: endsAt,
      proTrialExpiredAt: null,
      proTrialExpiredEmailSentAt: null,
    },
    select: { proTrialEndsAt: true },
  });
}

export async function expireTrialForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      paddleSubscriptionId: true,
      proTrialEndsAt: true,
      proTrialExpiredEmailSentAt: true,
    },
  });

  if (!user?.proTrialEndsAt || user.proTrialEndsAt > new Date()) return { expired: false };
  if (user.paddleSubscriptionId) return { expired: false };

  const expiredAt = new Date();
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: "free",
      proTrialExpiredAt: expiredAt,
    },
    select: { proTrialExpiredEmailSentAt: true },
  });

  if (!updated.proTrialExpiredEmailSentAt && user.email) {
    try {
      await sendTrialExpiredEmail({ to: user.email, name: user.name });
      await prisma.user.update({
        where: { id: user.id },
        data: { proTrialExpiredEmailSentAt: new Date() },
      });
    } catch (err) {
      console.error(`[trial] failed to send expired email userId=${user.id}:`, err);
    }
  }

  return { expired: true };
}

export async function expireDueTrials(limit = 100) {
  const now = new Date();
  const users = await prisma.user.findMany({
    where: {
      plan: "pro",
      paddleSubscriptionId: null,
      proTrialEndsAt: { lte: now },
    },
    select: { id: true },
    take: limit,
  });

  const results = [];
  for (const user of users) {
    results.push({ userId: user.id, ...(await expireTrialForUser(user.id)) });
  }
  return results;
}
