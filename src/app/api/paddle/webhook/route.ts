import { NextRequest, NextResponse } from "next/server";
import {
  getPaddleTransaction,
  getPlanDetailsFromPaddleItems,
  verifyPaddleWebhookSignature,
  type PaddleSubscription,
} from "@/lib/paddle";
import { prisma } from "@/lib/prisma";
import { syncUserFromPaddleTransaction } from "@/lib/paddle-sync";

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
  const plan = hasPaidAccess ? getPlanDetailsFromPaddleItems(subscription.items).plan : "free";

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
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
  let userId = typeof custom.userId === "string" ? custom.userId : undefined;

  const customerId = typeof data.customer_id === "string" ? data.customer_id : undefined;
  if (!userId && customerId) {
    const existingUser = await prisma.user.findFirst({
      where: { paddleCustomerId: customerId },
      select: { id: true },
    });
    userId = existingUser?.id;
  }

  if (!userId) return NextResponse.json({ received: true });

  if (type === "transaction.completed") {
    const transactionId = typeof data.id === "string" ? data.id : undefined;
    if (!transactionId) return NextResponse.json({ received: true });
    await syncUserFromPaddleTransaction(userId, transactionId);
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
