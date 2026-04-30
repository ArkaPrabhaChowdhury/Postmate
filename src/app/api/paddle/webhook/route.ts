import { NextRequest, NextResponse } from "next/server";
import { getPlanFromPriceId } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const event = await req.json();
  const type = event?.event_type as string | undefined;
  const data = event?.data;

  if (!type || !data) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const custom = data.custom_data ?? data.transaction?.custom_data ?? {};
  const userId = custom.userId as string | undefined;
  if (!userId) return NextResponse.json({ received: true });

  if (type === "transaction.completed" || type === "subscription.updated") {
    const priceId = data.items?.[0]?.price?.id ?? "";
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: getPlanFromPriceId(priceId),
        stripeSubscriptionId: data.subscription_id ?? null,
        stripePriceId: priceId || null,
        proTrialExpiredAt: null,
      },
    });
  }

  if (type === "subscription.canceled") {
    await prisma.user.update({
      where: { id: userId },
      data: { plan: "free", stripeSubscriptionId: null, stripePriceId: null, stripeCurrentPeriodEnd: null },
    });
  }

  return NextResponse.json({ received: true });
}
