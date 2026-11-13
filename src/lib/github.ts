import { Octokit } from "octokit";
import { prisma } from "@/lib/prisma";
import { logExtraction } from "@/lib/logger";
import { decryptGitHubToken, encryptGitHubToken, isEncryptedGitHubToken } from "@/lib/github-token";

export type GitHubRepoListItem = {
  id: number;
  full_name: string;
  private: boolean;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string | null;
};

export async function getGitHubAccessToken(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { id: true, access_token: true },
  });
  const token = decryptGitHubToken(account?.access_token);
  if (!account || !token) {
    throw new Error(
      "Missing GitHub access token. Try signing out and signing in again."
    );
  }
  if (!isEncryptedGitHubToken(account.access_token ?? "")) {
    await prisma.account.update({
      where: { id: account.id },
      data: { access_token: encryptGitHubToken(token) },
    });
  }
  return token;
}

export async function getOctokitForUser(userId: string): Promise<Octokit> {
  const token = await getGitHubAccessToken(userId);
  return new Octokit({ auth: token });
}

export async function listUserRepos(
  userId: string,
  options?: { page?: number; perPage?: number }
): Promise<GitHubRepoListItem[]> {
  const octokit = await getOctokitForUser(userId);
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 10;
  const res = await octokit.rest.repos.listForAuthenticatedUser({
    page,
    per_page: perPage,
    sort: "updated",
    visibility: "public",
  });

  return res.data.filter((repo) => !repo.private).map((repo) => ({
    id: repo.id,
    full_name: repo.full_name,
    private: repo.private,
    description: repo.description ?? null,
    language: repo.language ?? null,
    stargazers_count: repo.stargazers_count ?? 0,
    updated_at: repo.updated_at ?? null,
  }));
}

export async function assertPublicRepo(owner: string, repo: string): Promise<void> {
  // Check without the user's token so a legacy broad OAuth grant cannot expose
  // private repository metadata during the visibility check.
  const octokit = new Octokit();
  try {
    const response = await octokit.rest.repos.get({ owner, repo });
    if (response.data.private) {
      throw new Error("Postmate currently supports public repositories only.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("public repositories only")) throw error;
    if ((error as { status?: number })?.status === 404) {
      throw new Error("Repository not found or private. Postmate currently supports public repositories only.");
    }
    throw error;
  }
}

export async function syncRecentCommitsForRepo(params: {
  userId: string;
  repoId: string;
  fullName: string;
  perPage?: number;
}) {
  const [owner, repo] = params.fullName.split("/");
  if (!owner || !repo) {
    throw new Error("Invalid repo full name. Expected owner/repo.");
  }

  const octokit = await getOctokitForUser(params.userId);
  await assertPublicRepo(owner, repo);
  const res = await octokit.rest.repos.listCommits({
    owner,
    repo,
    per_page: params.perPage ?? 20,
  });

  const rows = res.data.map((commit) => {
    const message = commit.commit?.message ?? "";
    const authoredAt = commit.commit?.author?.date ?? null;
    const authorLogin = commit.author?.login ?? null;

    return {
      repoId: params.repoId,
      type: "commit" as const,
      externalId: commit.sha,
      title: message.split(/\r?\n/)[0]?.trim() ?? message,
      url: commit.html_url ?? null,
      authorLogin,
      authoredAt: authoredAt ? new Date(authoredAt) : null,
      payloadJson: JSON.stringify({
        sha: commit.sha,
        message,
        html_url: commit.html_url,
        authoredAt,
        authorLogin,
      }),
    };
  });

  await Promise.all([
    ...rows.map((row) =>
      prisma.gitHubEvent.upsert({
        where: {
          repoId_type_externalId: {
            repoId: row.repoId,
            type: row.type,
            externalId: row.externalId,
          },
        },
        create: row,
        update: {
          title: row.title,
          url: row.url,
          authorLogin: row.authorLogin,
          authoredAt: row.authoredAt,
          payloadJson: row.payloadJson,
        },
      })
    ),
    prisma.repo.update({ where: { id: params.repoId }, data: {} }),
  ]);
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

export async function getVoiceFingerprintData(userId: string): Promise<{
  bio: string;
  commitMessages: string[];
  readmeExcerpts: string[];
  repoDescriptions: string[];
}> {
  const octokit = await getOctokitForUser(userId);

  const [profileRes, reposRes] = await Promise.allSettled([
    octokit.rest.users.getAuthenticated(),
    octokit.rest.repos.listForAuthenticatedUser({ per_page: 10, sort: "updated", visibility: "public" }),
  ]);

  const bio =
    profileRes.status === "fulfilled"
      ? (profileRes.value.data.bio ?? "")
      : "";

  const repos =
    reposRes.status === "fulfilled"
    ? reposRes.value.data.filter((repo) => !repo.private).slice(0, 5)
      : [];

  const repoDescriptions = repos
    .map((r) => r.description ?? "")
    .filter(Boolean);

  // Fetch commits from top 3 repos in parallel
  const commitFetches = repos.slice(0, 3).map((r) =>
    octokit.rest.repos
      .listCommits({ owner: r.owner.login, repo: r.name, per_page: 20 })
      .then((res) => res.data.map((c) => c.commit?.message ?? "").filter(Boolean))
      .catch(() => [] as string[])
  );

  // Fetch READMEs from top 3 repos in parallel
  const readmeFetches = repos.slice(0, 3).map((r) =>
    octokit.rest.repos
      .getReadme({ owner: r.owner.login, repo: r.name })
      .then((res) => {
        const raw = Buffer.from(res.data.content, "base64").toString("utf8");
        // Use the full cleaned README prose so voice extraction can see the whole project narrative.
        return raw
          .replace(/```[\s\S]*?```/g, "")
          .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim();
      })
      .catch(() => "")
  );

  const [commitResults, readmeResults] = await Promise.all([
    Promise.all(commitFetches),
    Promise.all(readmeFetches),
  ]);

  const commitMessages = commitResults.flat().slice(0, 60);
  const readmeExcerpts = readmeResults.filter(Boolean);

  return { bio, commitMessages, readmeExcerpts, repoDescriptions };
}

export async function getRepoContext(params: {
  userId: string;
  owner: string;
  repo: string;
}) {
  await assertPublicRepo(params.owner, params.repo);
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
