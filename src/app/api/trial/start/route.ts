import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startProTrial } from "@/lib/trials";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const trial = await startProTrial(user.id);
    return NextResponse.json({ ok: true, trialEndsAt: trial.proTrialEndsAt });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to start trial" }, { status: 400 });
  }
}
