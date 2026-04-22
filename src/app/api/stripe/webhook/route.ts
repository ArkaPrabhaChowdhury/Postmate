import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlanFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const handled = [
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "checkout.session.completed",
  ];

  if (!handled.includes(event.type)) {
    return NextResponse.json({ received: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "subscription") return NextResponse.json({ received: true });

    const userId = session.metadata?.userId;
    if (!userId) return NextResponse.json({ received: true });

    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
    const priceId = sub.items.data[0]?.price?.id ?? "";
    const plan = getPlanFromPriceId(priceId);

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
      },
    });
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
    if (!user) return NextResponse.json({ received: true });

    const priceId = sub.items.data[0]?.price?.id ?? "";
    const plan = getPlanFromPriceId(priceId);
    const isActive = sub.status === "active" || sub.status === "trialing";

    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: isActive ? plan : "free",
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
      },
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: "free", stripeSubscriptionId: null, stripePriceId: null, stripeCurrentPeriodEnd: null },
      });
    }
  }

  return NextResponse.json({ received: true });
}
