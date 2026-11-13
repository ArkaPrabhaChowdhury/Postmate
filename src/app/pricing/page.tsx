import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import PricingClient from "./PricingClient";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const countryCode = (await headers()).get("x-vercel-ip-country")?.toUpperCase() ?? "US";
  const session = await getServerSession(authOptions);
  const user = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email }, select: { plan: true } })
    : null;
  return <PricingClient countryCode={countryCode} isPro={user?.plan === "pro"} />;
}
