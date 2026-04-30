import { prisma } from "@/lib/prisma";
import { getPaddleSubscription, getPaddleTransaction, getPlanDetailsFromPaddleItems } from "@/lib/paddle";

async function resolveUserIdForTransaction(userId: string, transactionId: string) {
  const transaction = await getPaddleTransaction(transactionId);
  const customUserId = typeof transaction.custom_data?.userId === "string" ? transaction.custom_data.userId : undefined;

  if (customUserId && customUserId !== userId) {
    throw new Error("Transaction belongs to a different user.");
  }

  if (customUserId) {
    return { userId: customUserId, transaction };
  }

  if (transaction.customer_id) {
    const user = await prisma.user.findFirst({
      where: { id: userId, paddleCustomerId: transaction.customer_id },
      select: { id: true },
    });
    if (user) return { userId: user.id, transaction };
  }

  return { userId, transaction };
}

export async function syncUserFromPaddleTransaction(userId: string, transactionId: string) {
  const resolved = await resolveUserIdForTransaction(userId, transactionId);
  const { transaction } = resolved;

  if (transaction.subscription_id) {
    const subscription = await getPaddleSubscription(transaction.subscription_id);
    const { plan, priceId } = getPlanDetailsFromPaddleItems(subscription.items);
    const hasPaidAccess = subscription.status === "active" || subscription.status === "trialing";

    await prisma.user.update({
      where: { id: resolved.userId },
      data: {
        plan: hasPaidAccess ? plan : "free",
        paddleCustomerId: subscription.customer_id ?? transaction.customer_id ?? null,
        paddleSubscriptionId: hasPaidAccess ? subscription.id : null,
        paddlePriceId: hasPaidAccess ? priceId || null : null,
        paddleCurrentPeriodEnd: hasPaidAccess && subscription.current_billing_period?.ends_at
          ? new Date(subscription.current_billing_period.ends_at)
          : null,
        proTrialExpiredAt: hasPaidAccess ? null : undefined,
      },
    });

    return;
  }

  const { plan, priceId } = getPlanDetailsFromPaddleItems(transaction.items);
  await prisma.user.update({
    where: { id: resolved.userId },
    data: {
      plan,
      paddleCustomerId: transaction.customer_id ?? null,
      paddlePriceId: priceId || null,
      proTrialExpiredAt: null,
    },
  });
}
