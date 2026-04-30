import { NextRequest, NextResponse } from "next/server";
import { getPlanFromPriceId } from "@/lib/plans";
import {
  getPaddleSubscription,
  getPaddleTransaction,
  verifyPaddleWebhookSignature,
  type PaddleSubscription,
} from "@/lib/paddle";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type PaddleWebhookEvent = {
  event_type?: string;
  data?: Record<string, unknown>;
};

type PaddleWebhookData = Record<string, unknown> & {
  transaction?: {
    custom_data?: Record<string, unknown>;
  };
  custom_data?: Record<string, unknown>;
  id?: string;
  subscription_id?: string;
  customer_id?: string;
  items?: Array<{ price?: { id?: string } }>;
};

function getSubscriptionPriceId(subscription: PaddleSubscription) {
  return subscription.items?.[0]?.price?.id ?? "";
}

function subscriptionKeepsPaidAccess(status: string) {
  return status === "active" || status === "trialing";
}

async function upsertFromSubscription(userId: string, subscription: PaddleSubscription) {
  const priceId = getSubscriptionPriceId(subscription);
  const hasPaidAccess = subscriptionKeepsPaidAccess(subscription.status);

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: hasPaidAccess ? getPlanFromPriceId(priceId) : "free",
      paddleCustomerId: subscription.customer_id ?? null,
      paddleSubscriptionId: hasPaidAccess ? subscription.id : null,
      paddlePriceId: hasPaidAccess ? priceId || null : null,
      paddleCurrentPeriodEnd: hasPaidAccess && subscription.current_billing_period?.ends_at
        ? new Date(subscription.current_billing_period.ends_at)
        : null,
      proTrialExpiredAt: hasPaidAccess ? null : undefined,
    },
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("Paddle-Signature");
  const secret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "PADDLE_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  if (!signature || !verifyPaddleWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid Paddle signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as PaddleWebhookEvent;
  const type = event.event_type;
  const data = event.data as PaddleWebhookData | undefined;

  if (!type || !data) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const custom = data.custom_data ?? data.transaction?.custom_data ?? {};
  const userId = typeof custom.userId === "string" ? custom.userId : undefined;
  if (!userId) return NextResponse.json({ received: true });

  if (type === "transaction.completed") {
    const transactionId = typeof data.id === "string" ? data.id : undefined;
    const transaction = transactionId ? await getPaddleTransaction(transactionId) : null;
    const subscriptionId = typeof data.subscription_id === "string"
      ? data.subscription_id
      : transaction?.subscription_id ?? undefined;

    if (subscriptionId) {
      const subscription = await getPaddleSubscription(subscriptionId);
      await upsertFromSubscription(userId, subscription);
      return NextResponse.json({ received: true });
    }

    const firstItem = Array.isArray(data.items) ? data.items[0] as { price?: { id?: string } } | undefined : undefined;
    const priceId = firstItem?.price?.id ?? "";

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: getPlanFromPriceId(priceId),
        paddleCustomerId: typeof data.customer_id === "string" ? data.customer_id : transaction?.customer_id ?? null,
        paddlePriceId: priceId || null,
        proTrialExpiredAt: null,
      },
    });

    return NextResponse.json({ received: true });
  }

  if (
    type === "subscription.created" ||
    type === "subscription.updated" ||
    type === "subscription.resumed" ||
    type === "subscription.canceled"
  ) {
    await upsertFromSubscription(userId, data as unknown as PaddleSubscription);
  }

  return NextResponse.json({ received: true });
}
