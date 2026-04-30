"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { getRepoContext, parseFullName } from "@/lib/github";
import { scorePost, generateLinkedInPost, type PostScore } from "@/lib/ai";
import { logExtraction } from "@/lib/logger";
import { postToLinkedIn } from "@/lib/linkedin";
import fs from "fs";
import path from "path";
import crypto from "crypto";

function extractReadmeImageUrls(readme: string): string[] {
  const urls: string[] = [];

  const mdImg = /!\[[^\]]*]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = mdImg.exec(readme))) {
    urls.push(m[1].trim());
  }

  const htmlImg = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((m = htmlImg.exec(readme))) {
    urls.push(m[1].trim());
  }

  return urls;
}

function isLikelyBadge(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes("shields.io") || u.includes("badge") || u.includes("travis") || u.includes("github.com/badges");
}

function resolveReadmeUrl(url: string, owner: string, repo: string, branch: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;

  const clean = url.replace(/^\.?\//, "");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${clean}`;
}

const IGNORED_SITE_HOSTS = new Set([
  "nextjs.org",
  "react.dev",
  "reactjs.org",
  "vercel.com",
  "github.com",
]);

function extractFirstHttpUrl(readme: string): string | null {
  const matches = readme.match(/https?:\/\/[^\s)]+/gi) ?? [];
  for (const raw of matches) {
    try {
      const u = new URL(raw);
      const host = u.hostname.replace(/^www\./, "");
      if (IGNORED_SITE_HOSTS.has(host)) continue;
      return raw;
    } catch {
      continue;
    }
  }
  return null;
}

function normalizeSiteUrl(url: string): string {
  const clean = url.trim();
  if (!/^https?:\/\//i.test(clean)) return `https://${clean}`;
  return clean;
}

async function takeScreenshot(url: string): Promise<string> {
  const safeUrl = normalizeSiteUrl(url);
  if (!/^https?:\/\//i.test(safeUrl)) return "";

  const hash = crypto.createHash("sha1").update(safeUrl).digest("hex");
  const file = `${hash}.png`;
  const outDir = path.join(process.cwd(), "public", "screenshots");
  const outPath = path.join(outDir, file);

  if (fs.existsSync(outPath)) return `/screenshots/${file}`;

  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    try {
      await page.goto(safeUrl, { waitUntil: "networkidle", timeout: 20000 });
    } catch {
      await page.goto(safeUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: outPath, fullPage: true });
    await browser.close();
    return `/screenshots/${file}`;
  } catch (err: any) {
    logExtraction("image_lookup_screenshot_error", { message: err?.message ?? "unknown" });
    return "";
  }
}

export async function savePost(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  if (!id) throw new Error("Missing post id.");

  await prisma.generatedPost.update({
    where: { id, userId },
    data: { content },
  });

  revalidatePath(`/posts/${id}`);
  revalidatePath("/dashboard");
}

export async function markPostCopied(id: string) {
  const userId = await requireUserId();
  await prisma.generatedPost.update({
    where: { id, userId },
    data: { status: "copied" },
  });
  revalidatePath(`/posts/${id}`);
  revalidatePath("/dashboard");
}

export async function scorePostAction(content: string): Promise<PostScore> {
  await requireUserId();
  return scorePost(content);
}

export async function regeneratePostAction(postId: string, additionalPrompt: string): Promise<string> {
  const userId = await requireUserId();

  const post = await prisma.generatedPost.findFirst({
    where: { id: postId, userId },
    select: {
      platform: true,
      style: true,
      sourceId: true,
      repo: { select: { fullName: true } },
    },
  });
  if (!post || !post.repo) throw new Error("Post or repo not found.");

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { voiceMemory: true, tone: true },
  });

  const { owner, repo } = parseFullName(post.repo.fullName);
  const context = await getRepoContext({ userId, owner, repo });

  const commit = context.commits.find((c) => c.sha === post.sourceId) ?? context.commits[0];
  if (!commit) throw new Error("Commit not found in repo context.");

  const content = await generateLinkedInPost({
    repoFullName: post.repo.fullName,
    style: post.style as Parameters<typeof generateLinkedInPost>[0]["style"],
    platform: post.platform === "x" ? "x" : "linkedin",
    commit,
    voiceMemory: settings?.voiceMemory ?? undefined,
    tone: settings?.tone ?? undefined,
    additionalPrompt,
  });

  await prisma.generatedPost.update({
    where: { id: postId, userId },
    data: { content },
  });

  revalidatePath(`/posts/${postId}`);
  return content;
}

export async function findPostImage(formData: FormData): Promise<string> {
  const userId = await requireUserId();
  const repoFullNameFromForm = String(formData.get("repoFullName") ?? "").trim();
  const postId = String(formData.get("postId") ?? "").trim();
  const manualSiteUrl = String(formData.get("siteUrl") ?? "").trim();

  logExtraction("image_lookup_start", { repoFullNameFromForm, postId });

  let repoFullName = repoFullNameFromForm;
  if (!repoFullName && postId) {
    const post = await prisma.generatedPost.findFirst({
      where: { id: postId, userId },
      select: { repo: { select: { fullName: true } } },
    });
    repoFullName = post?.repo?.fullName ?? "";
    logExtraction("image_lookup_post_repo", { repoFullName });
  }

  if (!repoFullName) {
    logExtraction("image_lookup_no_repo", {});
    return "";
  }

  const { owner, repo } = parseFullName(repoFullName);
  const context = await getRepoContext({ userId, owner, repo });

  const imageCandidates = extractReadmeImageUrls(context.readme)
    .filter((u) => u && !isLikelyBadge(u))
    .map((u) => resolveReadmeUrl(u, owner, repo, context.defaultBranch || "HEAD"));

  logExtraction("image_lookup_readme_images", {
    count: imageCandidates.length,
    first: imageCandidates[0] ?? null,
  });

  if (imageCandidates.length) return imageCandidates[0];

  const siteUrl = manualSiteUrl || context.homepage || extractFirstHttpUrl(context.readme);
  logExtraction("image_lookup_site_url", { siteUrl: siteUrl || null, homepage: context.homepage || null });
  if (!siteUrl) return "";

  const screenshotUrl = await takeScreenshot(siteUrl);
  logExtraction("image_lookup_screenshot", { screenshotUrl });
  return screenshotUrl;
}

export async function postToLinkedInNow(postId: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const post = await prisma.generatedPost.findFirst({
    where: { id: postId, userId },
    select: { content: true },
  });
  if (!post) return { ok: false, error: "Post not found." };

  try {
    const linkedinPostId = await postToLinkedIn(userId, post.content);
    await prisma.generatedPost.update({
      where: { id: postId },
      data: { linkedinStatus: "posted", linkedinPostId, status: "posted" },
    });
    revalidatePath(`/posts/${postId}`);
    return { ok: true };
  } catch (err) {
    await prisma.generatedPost.update({
      where: { id: postId },
      data: { linkedinStatus: "failed" },
    });
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function scheduleLinkedInPost(postId: string, scheduledAt: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const post = await prisma.generatedPost.findFirst({
    where: { id: postId, userId },
    select: { id: true },
  });
  if (!post) return { ok: false, error: "Post not found." };

  const date = new Date(scheduledAt);
  if (isNaN(date.getTime()) || date <= new Date()) {
    return { ok: false, error: "Scheduled time must be in the future." };
  }

  await prisma.generatedPost.update({
    where: { id: postId },
    data: { linkedinStatus: "scheduled", scheduledAt: date },
  });
  revalidatePath(`/posts/${postId}`);
  return { ok: true };
}

export async function cancelLinkedInSchedule(postId: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.generatedPost.updateMany({
    where: { id: postId, userId },
    data: { linkedinStatus: "none", scheduledAt: null },
  });
  revalidatePath(`/posts/${postId}`);
}
