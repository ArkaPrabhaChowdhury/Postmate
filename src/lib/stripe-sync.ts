import { prisma } from "@/lib/prisma";
import { stripe, getPlanFromPriceId } from "@/lib/stripe";

export async function syncUserFromCheckoutSession(userId: string, checkoutSessionId: string) {
  if (!checkoutSessionId) return;

  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
  if (!session || session.mode !== "subscription") return;

  const metaUserId = session.metadata?.userId;
  if (!metaUserId || metaUserId !== userId) return;

  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subscriptionId) return;

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = sub.items.data[0]?.price?.id ?? "";
  const plan = getPlanFromPriceId(priceId);
  const isActive = sub.status === "active" || sub.status === "trialing";

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: isActive ? plan : "free",
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? undefined,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
      proTrialExpiredAt: null,
    },
  });
}
