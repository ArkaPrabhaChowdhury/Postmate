import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPaddleCheckout, PLANS, type Plan } from "@/lib/paddle";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, billingInterval } = (await req.json()) as { plan: Plan; billingInterval?: "monthly" | "yearly" };
  const interval = billingInterval === "yearly" ? "yearly" : "monthly";
  const priceId = PLANS[plan]?.priceIds?.[interval] ?? null;
  if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const successUrl = `${process.env.NEXTAUTH_URL}/dashboard?upgraded=1`;
  const transaction = await createPaddleCheckout({
    userId: user.id,
    email: session.user.email,
    name: session.user.name ?? undefined,
    priceId,
    plan,
    billingInterval: interval,
    successUrl,
  });

  return NextResponse.json({ url: transaction.data.checkout.url });
}
