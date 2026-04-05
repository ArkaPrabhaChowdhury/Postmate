import { Octokit } from "octokit";
import { prisma } from "@/lib/prisma";
import { logExtraction } from "@/lib/logger";

export async function getGitHubAccessToken(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });
  if (!account?.access_token) {
    throw new Error(
      "Missing GitHub access token. Try signing out and signing in again."
    );
  }
  return account.access_token;
}

export async function getOctokitForUser(userId: string): Promise<Octokit> {
  const token = await getGitHubAccessToken(userId);
  return new Octokit({ auth: token });
}

export async function getGitHubProfile(userId: string): Promise<{
  name?: string;
  login?: string;
  bio?: string;
  company?: string;
  location?: string;
  blog?: string;
  twitter?: string;
}> {
  const octokit = await getOctokitForUser(userId);
  const res = await octokit.rest.users.getAuthenticated();
  const u = res.data;
  return {
    name: u.name ?? undefined,
    login: u.login ?? undefined,
    bio: u.bio ?? undefined,
    company: u.company ?? undefined,
    location: u.location ?? undefined,
    blog: u.blog ?? undefined,
    twitter: (u as unknown as { twitter_username?: string }).twitter_username ?? undefined,
  };
}

export function parseFullName(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) throw new Error("Invalid repo full name. Expected owner/repo.");
  return { owner, repo };
}

export async function getRepoContext(params: {
  userId: string;
  owner: string;
  repo: string;
}) {
  const octokit = await getOctokitForUser(params.userId);

  const [repoRes, readmeRes, commitsRes, languagesRes] = await Promise.allSettled([
    octokit.rest.repos.get({ owner: params.owner, repo: params.repo }),
    octokit.rest.repos.getReadme({ owner: params.owner, repo: params.repo }),
    octokit.rest.repos.listCommits({ owner: params.owner, repo: params.repo, per_page: 40 }),
    octokit.rest.repos.listLanguages({ owner: params.owner, repo: params.repo }),
  ]);

  const description =
    repoRes.status === "fulfilled" ? repoRes.value.data.description ?? "" : "";
  const topics =
    repoRes.status === "fulfilled" && Array.isArray(repoRes.value.data.topics)
      ? repoRes.value.data.topics
      : [];
  const homepage =
    repoRes.status === "fulfilled" ? repoRes.value.data.homepage ?? "" : "";
  const defaultBranch =
    repoRes.status === "fulfilled" ? repoRes.value.data.default_branch ?? "HEAD" : "HEAD";

  let readme = "";
  if (readmeRes.status === "fulfilled") {
    const content = readmeRes.value.data.content;
    if (content) {
      try {
        readme = Buffer.from(content, "base64").toString("utf8");
      } catch {
        readme = "";
      }
    }
  }

  const commits =
    commitsRes.status === "fulfilled"
      ? commitsRes.value.data.map((c) => ({
        sha: c.sha,
        message: c.commit?.message ?? "",
        authoredAt: c.commit?.author?.date ?? "",
      }))
      : [];

  const languages =
    languagesRes.status === "fulfilled"
      ? Object.keys(languagesRes.value.data ?? {})
      : [];

  logExtraction("repo_context", {
    owner: params.owner,
    repo: params.repo,
    description,
    topics,
    languages,
    commitsCount: commits.length,
    commitsSample: commits.slice(0, 5),
    readmeChars: readme.length,
  });

  return {
    description,
    topics,
    homepage,
    defaultBranch,
    readme,
    commits,
    languages,
  };
}
