"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseFullName } from "@/lib/github";
import { requireUserId } from "@/lib/requireUser";

export async function saveXSettings(enforce280: boolean) {
  const userId = await requireUserId();
  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, xEnforce280: enforce280 },
    update: { xEnforce280: enforce280 },
  });
  revalidatePath("/settings");
}

export async function setActiveRepo(formData: FormData) {
  const userId = await requireUserId();
  const fullNameRaw = String(formData.get("fullName") ?? "").trim();
  if (!fullNameRaw) throw new Error("Repo is required.");

  const fullName = fullNameRaw.replace(/^https?:\/\/github\.com\//i, "").replace(/\/+$/, "");
  const { owner, repo } = parseFullName(fullName);

  await prisma.repo.updateMany({
    where: { userId },
    data: { isActive: false },
  });

  await prisma.repo.upsert({
    where: { userId_fullName: { userId, fullName } },
    create: { userId, owner, name: repo, fullName, isActive: true },
    update: { owner, name: repo, isActive: true },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

