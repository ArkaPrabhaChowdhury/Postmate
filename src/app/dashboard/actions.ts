"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { getOctokitForUser, getRepoContext, getGitHubProfile, getVoiceFingerprintData } from "@/lib/github";
import { fetchDevNews } from "@/lib/news";
import { generateLinkedInPost, generateProjectStrategy, generateJourneyPosts, generateProjectShowcase, generateTrendPost, generateVoiceFingerprint, generateClusteredPosts, type PostStyle } from "@/lib/ai";
import { assertCanGeneratePost, assertProPlan } from "@/lib/plan-limits";

function firstLine(s: string): string {
  return s.split(/\r?\n/)[0]?.trim() ?? s;
}

export async function syncRecentCommits() {
  const userId = await requireUserId();
  const repo = await prisma.repo.findFirst({
    where: { userId, isActive: true },
    select: { id: true, owner: true, name: true, fullName: true },
  });
  if (!repo) redirect("/settings");

  const octokit = await getOctokitForUser(userId);
  const res = await octokit.rest.repos.listCommits({
    owner: repo.owner,
    repo: repo.name,
    per_page: 20,
  });

  const rows = res.data.map((c) => {
    const message = c.commit?.message ?? "";
    const authoredAt = c.commit?.author?.date ?? null;
    const authorLogin = c.author?.login ?? null;
    return {
      repoId: repo.id,
      type: "commit",
      externalId: c.sha,
      title: firstLine(message),
      url: c.html_url ?? null,
      authorLogin,
      authoredAt: authoredAt ? new Date(authoredAt) : null,
      payloadJson: JSON.stringify({
        sha: c.sha,
        message,
        html_url: c.html_url,
        authoredAt,
        authorLogin,
      }),
    };
  });

  for (const row of rows) {
    await prisma.gitHubEvent.upsert({
      where: { repoId_type_externalId: { repoId: row.repoId, type: row.type, externalId: row.externalId } },
      create: row,
      update: {
        title: row.title,
        url: row.url,
        authorLogin: row.authorLogin,
        authoredAt: row.authoredAt,
        payloadJson: row.payloadJson,
      },
    });
  }

  revalidatePath("/dashboard");
}

export async function generatePostFromCommit(formData: FormData) {
  const userId = await requireUserId();
  const sha = String(formData.get("sha") ?? "").trim();
  const style = String(formData.get("style") ?? "progress").trim() as PostStyle;
  const platform = (String(formData.get("platform") ?? "linkedin").trim() || "linkedin") as "linkedin" | "x";
  if (!sha) throw new Error("Missing commit SHA.");
  await assertCanGeneratePost(userId, style);

  const repo = await prisma.repo.findFirst({
    where: { userId, isActive: true },
    select: { id: true, owner: true, name: true, fullName: true },
  });
  if (!repo) redirect("/settings");

  const octokit = await getOctokitForUser(userId);
  const commitRes = await octokit.rest.repos.getCommit({
    owner: repo.owner,
    repo: repo.name,
    ref: sha,
  });

  const commit = commitRes.data;
  const message = commit.commit?.message ?? "";
  const authoredAt = commit.commit?.author?.date ?? undefined;
  const authorLogin = commit.author?.login ?? undefined;

  const files =
    commit.files?.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
      patch: f.patch,
    })) ?? [];

  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  const content = await generateLinkedInPost({
    repoFullName: repo.fullName,
    style,
    platform,
    commit: {
      sha,
      message: firstLine(message),
      url: commit.html_url,
      authoredAt,
      authorLogin,
      files,
    },
    voiceMemory: settings?.voiceMemory ?? undefined,
    tone: settings?.tone ?? undefined,
    enforce280: platform === "x" ? (settings?.xEnforce280 ?? true) : undefined,
  });

  const post = await prisma.generatedPost.create({
    data: {
      userId,
      repoId: repo.id,
      sourceType: "commit",
      sourceId: sha,
      style,
      content,
      status: "draft",
    },
    select: { id: true },
  });

  revalidatePath("/dashboard");
  redirect(`/posts/${post.id}`);
}

export async function generateStrategyForRepo() {
  const userId = await requireUserId();
  await assertProPlan(userId);
  const repo = await prisma.repo.findFirst({
    where: { userId, isActive: true },
    select: { id: true, owner: true, name: true, fullName: true },
  });
  if (!repo) redirect("/settings");

  const context = await getRepoContext({
    userId,
    owner: repo.owner,
    repo: repo.name,
  });

  // Generate structured journey posts (JSON array)
  const journeyPosts = await generateJourneyPosts({
    repoFullName: repo.fullName,
    description: context.description,
    topics: context.topics,
    readme: context.readme,
    commits: context.commits,
    languages: context.languages,
  });

  const content = JSON.stringify(journeyPosts);

  const clientWithStrategy = prisma as unknown as {
    projectStrategy?: {
      upsert: (args: {
        where: { userId_repoId: { userId: string; repoId: string } };
        create: { userId: string; repoId: string; content: string };
        update: { content: string };
      }) => Promise<unknown>;
    };
  };

  if (clientWithStrategy.projectStrategy) {
    await clientWithStrategy.projectStrategy.upsert({
      where: { userId_repoId: { userId, repoId: repo.id } },
      create: { userId, repoId: repo.id, content },
      update: { content },
    });
  }

  revalidatePath("/dashboard");
}

export async function generateProjectShowcaseForRepo() {
  const userId = await requireUserId();
  await assertProPlan(userId);
  const repo = await prisma.repo.findFirst({
    where: { userId, isActive: true },
    select: { id: true, owner: true, name: true, fullName: true },
  });
  if (!repo) redirect("/settings");

  const context = await getRepoContext({
    userId,
    owner: repo.owner,
    repo: repo.name,
  });

  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  const content = await generateProjectShowcase({
    repoFullName: repo.fullName,
    description: context.description,
    topics: context.topics,
    readme: context.readme,
    commits: context.commits,
    languages: context.languages,
    voiceMemory: settings?.voiceMemory ?? undefined,
    tone: settings?.tone ?? undefined,
  });

  const post = await prisma.generatedPost.create({
    data: {
      userId,
      repoId: repo.id,
      sourceType: "repo",
      sourceId: repo.id,
      style: "project_showcase",
      content,
      status: "draft",
    },
    select: { id: true },
  });

  revalidatePath("/dashboard");
  redirect(`/posts/${post.id}`);
}

export async function autoGenerateVoice(): Promise<string> {
  const userId = await requireUserId();

  const fingerprintData = await getVoiceFingerprintData(userId);
  const generated = await generateVoiceFingerprint(fingerprintData);

  const existing = await prisma.userSettings.findUnique({
    where: { userId },
    select: { voiceMemory: true },
  });

  const voiceMemory = existing?.voiceMemory
    ? `${existing.voiceMemory}\n${generated}`
    : generated;

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, voiceMemory },
    update: { voiceMemory },
  });

  revalidatePath("/dashboard");
  return voiceMemory;
}

export async function saveVoiceSettings(formData: FormData) {
  const userId = await requireUserId();
  const voiceMemory = String(formData.get("voiceMemory") ?? "").trim();
  const tone = String(formData.get("tone") ?? "").trim();

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, voiceMemory: voiceMemory || null, tone: tone || null },
    update: { voiceMemory: voiceMemory || null, tone: tone || null },
  });

  revalidatePath("/dashboard");
}

export async function generateClusteredPostsAction(formData: FormData) {
  const userId = await requireUserId();
  await assertProPlan(userId);
  const platform = (String(formData.get("platform") ?? "linkedin").trim() || "linkedin") as "linkedin" | "x";

  const repo = await prisma.repo.findFirst({
    where: { userId, isActive: true },
    select: { id: true, owner: true, name: true, fullName: true },
  });
  if (!repo) redirect("/settings");

  const events = await prisma.gitHubEvent.findMany({
    where: { repoId: repo.id, type: "commit" },
    orderBy: { authoredAt: "desc" },
    take: 20,
    select: { externalId: true, title: true },
  });

  if (events.length === 0) throw new Error("No commits to cluster.");

  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  const clusters = await generateClusteredPosts({
    repoFullName: repo.fullName,
    commits: events.map((e) => ({ sha: e.externalId, message: e.title })),
    voiceMemory: settings?.voiceMemory ?? undefined,
    tone: settings?.tone ?? undefined,
    platform,
  });

  const posts = await Promise.all(
    clusters.map((cluster) =>
      prisma.generatedPost.create({
        data: {
          userId,
          repoId: repo.id,
          sourceType: "commit",
          sourceId: cluster.commitShas[0] ?? repo.id,
          style: "progress" as PostStyle,
          content: cluster.content,
          status: "draft",
        },
        select: { id: true },
      })
    )
  );

  revalidatePath("/dashboard");
  redirect(`/posts/${posts[0]!.id}`);
}

export async function generateSuggestedPost(formData: FormData) {
  const userId = await requireUserId();
  const commitSha = String(formData.get("commitSha") ?? "").trim();
  const repoId = String(formData.get("repoId") ?? "").trim();
  if (!commitSha || !repoId) throw new Error("Missing suggestion data.");

  const repo = await prisma.repo.findFirst({
    where: { id: repoId, userId },
    select: { id: true, owner: true, name: true, fullName: true },
  });
  if (!repo) throw new Error("Repo not found.");

  const event = await prisma.gitHubEvent.findFirst({
    where: { repoId: repo.id, type: "commit", externalId: commitSha },
    select: { externalId: true, title: true },
  });
  if (!event) throw new Error("Commit not found.");

  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  const content = await generateLinkedInPost({
    repoFullName: repo.fullName,
    style: "progress",
    commit: { sha: event.externalId, message: event.title },
    voiceMemory: settings?.voiceMemory ?? undefined,
    tone: settings?.tone ?? undefined,
  });

  const post = await prisma.generatedPost.create({
    data: {
      userId,
      repoId: repo.id,
      sourceType: "commit",
      sourceId: event.externalId,
      style: "progress",
      content,
      status: "draft",
    },
    select: { id: true },
  });

  revalidatePath("/dashboard");
  redirect(`/posts/${post.id}`);
}

function parseTrendsFromRss(xml: string): string[] {
  const titles = [...xml.matchAll(/<title><!\[CDATA\[(.*?)]]><\/title>/g)].map((m) => m[1]);
  return titles.slice(1).filter(Boolean);
}

async function fetchRecentTrends(): Promise<string[]> {
  try {
    const res = await fetch("https://trends.google.com/trends/trendingsearches/daily/rss?geo=US", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch trends");
    const xml = await res.text();
    const list = parseTrendsFromRss(xml);
    return list.slice(0, 12);
  } catch {
    return [
      "AI coding copilots",
      "Edge functions",
      "Vector databases",
      "LLM evaluation",
      "Serverless cost tuning",
      "RAG pipelines",
    ];
  }
}

export async function generateTrendPostFromRepo(formData: FormData) {
  const userId = await requireUserId();
  await assertProPlan(userId);
  const topic = String(formData.get("topic") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const platform = String(formData.get("platform") ?? "linkedin").trim().toLowerCase() as "linkedin" | "x";
  if (!topic && !headline) throw new Error("Missing topic or headline.");

  const repo = await prisma.repo.findFirst({
    where: { userId, isActive: true },
    select: { id: true },
  });
  if (!repo) redirect("/settings");

  const [profile, trends, devNews, settings] = await Promise.all([
    getGitHubProfile(userId),
    fetchRecentTrends(),
    fetchDevNews(),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  const content = await generateTrendPost({
    platform,
    topic: topic || "dev news",
    headline: headline || undefined,
    trends,
    devNews,
    profile,
    voiceMemory: settings?.voiceMemory ?? undefined,
    tone: settings?.tone ?? undefined,
    enforce280: platform === "x" ? (settings?.xEnforce280 ?? true) : undefined,
  });

  const post = await prisma.generatedPost.create({
    data: {
      userId,
      repoId: repo.id,
      sourceType: "trend",
      sourceId: `${platform}:${topic}`,
      style: "trend" as PostStyle,
      content,
      status: "draft",
    },
    select: { id: true },
  });

  revalidatePath("/dashboard");
  redirect(`/posts/${post.id}`);
}
