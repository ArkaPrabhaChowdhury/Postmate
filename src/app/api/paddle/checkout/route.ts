import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPaddleCheckout, PLANS, type Plan } from "@/lib/paddle";
import { prisma } from "@/lib/prisma";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { captureServerEvent } from "@/lib/posthog-server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = (await req.json()) as { plan: Plan };
  if (plan !== "pro") return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const priceId = PLANS.pro.priceId;
  if (!priceId) {
    return NextResponse.json({ error: "One-time Paddle price is not configured" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, plan: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.plan === "pro") {
    return NextResponse.json({ error: "Your account already has Pro access." }, { status: 409 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
  const checkoutUrl = appUrl ? new URL("/pay", appUrl).toString() : undefined;

  const transaction = await createPaddleCheckout({
    userId: user.id,
    email: session.user.email,
    name: session.user.name ?? undefined,
    priceId,
    plan,
    checkoutUrl,
  });

  await captureServerEvent({
    distinctId: user.id,
    event: ANALYTICS_EVENTS.checkoutCreated,
    properties: {
      plan,
      purchaseType: "one_time",
      transactionId: transaction.data.id,
    },
  });

  return NextResponse.json({ url: transaction.data.checkout.url });
}
