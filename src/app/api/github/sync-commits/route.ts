import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncRecentCommitsForRepo } from "@/lib/github";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeRepo = await prisma.repo.findFirst({
    where: { userId, isActive: true },
    select: { id: true, fullName: true, updatedAt: true },
  });

  if (!activeRepo) {
    return NextResponse.json({ synced: false, reason: "no_active_repo" });
  }

  const staleSince = Date.now() - activeRepo.updatedAt.getTime();
  if (staleSince <= 5 * 60 * 1000) {
    return NextResponse.json({ synced: false, reason: "fresh" });
  }

  try {
    await syncRecentCommitsForRepo({
      userId,
      repoId: activeRepo.id,
      fullName: activeRepo.fullName,
    });
    return NextResponse.json({ synced: true });
  } catch {
    return NextResponse.json({ synced: false, reason: "sync_failed" }, { status: 200 });
  }
}
