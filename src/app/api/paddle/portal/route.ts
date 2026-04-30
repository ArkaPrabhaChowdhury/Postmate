import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaddleSubscription } from "@/lib/paddle";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { paddleSubscriptionId: true },
  });

  if (!user?.paddleSubscriptionId) {
    return NextResponse.json({ error: "No active Paddle subscription found" }, { status: 400 });
  }

  const subscription = await getPaddleSubscription(user.paddleSubscriptionId);
  const url = subscription.management_urls?.update_payment_method ?? subscription.management_urls?.cancel ?? null;
  if (!url) {
    return NextResponse.json(
      { error: "Paddle customer portal links are unavailable. Check API key permissions for Customer portal session (Write)." },
      { status: 400 },
    );
  }

  return NextResponse.json({ url });
}
