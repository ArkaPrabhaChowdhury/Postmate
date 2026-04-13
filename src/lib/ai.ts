import OpenAI from "openai";
import dns from "dns";
import { Prompts } from "./prompts";
import { logExtraction } from "./logger";

// Force IPv4 for Node fetch to bypass broken IPv6 routing to Cloudflare (Groq API)
// which causes persistent "UND_ERR_SOCKET" connection drops.
dns.setDefaultResultOrder("ipv4first");

export type PostStyle = "progress" | "insight" | "build_in_public" | "project_showcase" | "trend";

export type JourneyPost = {
  title: string;
  stage: string;
  emoji: string;
  content: string;
};

export type CommitForPrompt = {
  sha: string;
  message: string;
  url?: string;
  authoredAt?: string;
  authorLogin?: string;
  files?: Array<{
    filename: string;
    status?: string;
    additions?: number;
    deletions?: number;
    changes?: number;
    patch?: string;
  }>;
};

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have",
  "if", "in", "into", "is", "it", "its", "of", "on", "or", "that", "the", "their", "then",
  "there", "these", "they", "this", "to", "was", "were", "will", "with", "you", "your",
]);

function cleanReadme(readme: string): string {
  return readme
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s*#+\s*/gm, "")
    .replace(/^\s*>\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractReadmeHighlights(readme: string, maxLines = 18): string[] {
  const lines = readme
    .replace(/```[\s\S]*?```/g, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  type Section = { heading: string; depth: number; idx: number; bullets: string[] };
  const sections: Section[] = [];

  let current: Section | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      current = {
        heading: headingMatch[2].trim(),
        depth: headingMatch[1].length,
        idx: i,
        bullets: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) continue;
    if (/^[-*•]\s+/.test(line)) {
      const clean = line.replace(/^[-*•]\s+/, "");
      current.bullets.push(clean);
    }
  }

  const highlights: string[] = [];
  for (const s of sections) {
    if (highlights.length >= maxLines) break;
    highlights.push(s.heading);
    if (highlights.length >= maxLines) break;
    if (s.bullets.length) highlights.push(s.bullets[0]);
  }

  return highlights.slice(0, maxLines);
}

function extractKeywords(text: string, max = 18): string[] {
  const counts = new Map<string, number>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-+./]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

function summarizeReadme(readme: string, maxChars = 600): { summary: string; keywords: string[] } {
  const cleaned = cleanReadme(readme);
  if (!cleaned) return { summary: "", keywords: [] };

  const highlights = extractReadmeHighlights(readme, 18);
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  const keywords = extractKeywords(cleaned, 18);

  let summary = "";
  for (const h of highlights) {
    if ((summary + " " + h).trim().length > maxChars) break;
    summary = summary ? `${summary} ${h}` : h;
  }

  if (summary.length < Math.min(120, maxChars)) {
    for (const s of sentences) {
      if ((summary + " " + s).trim().length > maxChars) break;
      summary = summary ? `${summary} ${s}` : s;
    }
  }

  for (const s of sentences) {
    if ((summary + " " + s).trim().length > maxChars) break;
    if (!summary) summary = s;
  }

  // If sentence split fails (e.g., no punctuation), fallback to truncate
  if (!summary) summary = cleaned.slice(0, maxChars).trim();

  logExtraction("readme_summary", {
    maxChars,
    cleanedChars: cleaned.length,
    summaryChars: summary.length,
    keywords,
    highlights,
  });

  return { summary, keywords };
}

function toneLabel(raw?: string): string | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  if (n <= 20) return "Very concise";
  if (n <= 40) return "Concise";
  if (n <= 60) return "Balanced";
  if (n <= 80) return "Expressive";
  return "Bold / punchy";
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getOpenAIClient() {
  return new OpenAI({
    apiKey: requiredEnv("GROQ_API_KEY"),
    baseURL: "https://api.groq.com/openai/v1",
  });
}

// Groq model to use — fast, free, high quality
const MODEL = "llama-3.3-70b-versatile";

async function chat(
  client: OpenAI,
  system: string,
  user: string,
  opts: { temperature?: number; max_tokens?: number } = {},
  retries = 3
): Promise<string> {
  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model: MODEL,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.max_tokens ?? 700,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const text = res.choices[0]?.message?.content?.trim();
      if (!text) throw new Error("OpenAI returned an empty response.");
      return text;
    } catch (err: any) {
      lastError = err;
      const status = err.status || err.response?.status;

      // Do not retry on 4xx auth or validation errors (except 429 rate limits)
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw err;
      }

      if (attempt < retries) {
        console.warn(`[AI] API error on attempt ${attempt}/${retries}: ${err.message}. Retrying...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      // If exhausted all retries, throw the last error
      throw err;
    }
  }
  throw lastError;
}

function normalizePostVoice(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trimStart();
      if (/^[-—]\s+I\s+/i.test(trimmed)) {
        const replaced = trimmed.replace(/^([-—]\s+)I\s+/i, "$1");
        return line.replace(trimmed, replaced.replace(/^([-—]\s+)([a-z])/, (_, p1, c) => p1 + c.toUpperCase()));
      }
      return line;
    })
    .join("\n");
}

// ─── generateLinkedInPost ────────────────────────────────────────────────────

export async function generateLinkedInPost(input: {
  repoFullName: string;
  style: PostStyle;
  commit: CommitForPrompt;
  voiceMemory?: string;
  tone?: string;
  platform?: "linkedin" | "x";
}): Promise<string> {
  const styleGuide = Prompts.getLinkedInPostStyleGuide(input.style);

  const filesSummary =
    input.commit.files?.length
      ? input.commit.files
        .slice(0, 12)
        .map((f) => {
          const change =
            typeof f.additions === "number" || typeof f.deletions === "number"
              ? ` (+${f.additions ?? 0}/-${f.deletions ?? 0})`
              : "";
          return `- ${f.filename}${change}`;
        })
        .join("\n")
      : "(No file list available.)";

  const patchHints = input.commit.files?.some((f) => f.patch)
    ? input.commit.files
      .filter((f) => f.patch)
      .slice(0, 4)
      .map((f) => `--- ${f.filename}\n${(f.patch ?? "").slice(0, 1200)}`)
      .join("\n\n")
    : "";

  const userMsg = [
    `Repo: ${input.repoFullName}`,
    `Commit: ${input.commit.sha.slice(0, 7)} — ${input.commit.message}`,
    input.commit.authorLogin ? `Author: ${input.commit.authorLogin}` : "",
    input.commit.authoredAt ? `Date: ${input.commit.authoredAt}` : "",
    input.voiceMemory ? `Voice memory: ${input.voiceMemory}` : "",
    input.tone ? `Tone: ${toneLabel(input.tone)}` : "",
    "",
    "Files changed:",
    filesSummary,
    patchHints ? "\nDiff snippets:" : "",
    patchHints,
  ]
    .filter(Boolean)
    .join("\n");

  const isX = input.platform === "x";
  const system = isX
    ? Prompts.xPostSystem(styleGuide)
    : Prompts.linkedinPostSystem(styleGuide);

  const client = getOpenAIClient();
  const raw = await chat(client, system, userMsg, {
    temperature: 0.75,
    max_tokens: isX ? 150 : 800,
  });
  return normalizePostVoice(raw);
}

// ─── generateProjectStrategy ─────────────────────────────────────────────────

export async function generateProjectStrategy(input: {
  repoFullName: string;
  description: string;
  topics: string[];
  readme: string;
  commits: { sha: string; message: string; authoredAt?: string }[];
  languages: string[];
}): Promise<string> {
  const commitLines = input.commits.slice(0, 40).map((c) => {
    const first = c.message.split(/\r?\n/)[0] ?? "";
    return `- [${c.authoredAt ?? ""}] ${c.sha.slice(0, 7)}: ${first}`;
  });

  const system = Prompts.projectStrategySystem;
  const readmeCompressed = summarizeReadme(input.readme, 900);
  const readmeHighlights = extractReadmeHighlights(input.readme, 18);

  const userMsg = [
    `Repository: ${input.repoFullName}`,
    input.description ? `Description: ${input.description}` : "",
    input.topics.length ? `Topics: ${input.topics.join(", ")}` : "",
    input.languages.length ? `Languages: ${input.languages.join(", ")}` : "",
    "",
    "Recent commits:",
    commitLines.join("\n") || "(none)",
    "",
    "README highlights:",
    readmeHighlights.length ? readmeHighlights.map((h) => `- ${h}`).join("\n") : "(none)",
    "",
    "README summary:",
    readmeCompressed.summary || "(empty)",
    readmeCompressed.keywords.length ? `Keywords: ${readmeCompressed.keywords.join(", ")}` : "",
    "",
    "Write a markdown document with EXACTLY these sections:",
    "## Project overview",
    "## Ideal audience",
    "## Story arc",
    "## Post playbook",
    "## Example posts",
  ]
    .filter(Boolean)
    .join("\n");

  const client = getOpenAIClient();
  return chat(client, system, userMsg, { temperature: 0.7, max_tokens: 1200 });
}

// ─── generateJourneyPosts ────────────────────────────────────────────────────

export async function generateJourneyPosts(input: {
  repoFullName: string;
  description: string;
  topics: string[];
  readme: string;
  commits: { sha: string; message: string; authoredAt?: string }[];
  languages: string[];
}): Promise<JourneyPost[]> {
  const commitLines = input.commits.slice(0, 10).map((c) => {
    const first = c.message.split(/\r?\n/)[0] ?? "";
    return `- ${c.sha.slice(0, 7)}: ${first}`;
  });

  const meta = [
    `Repo: ${input.repoFullName}`,
    input.description ? `Desc: ${input.description}` : "",
    input.languages.length ? `Stack: ${input.languages.slice(0, 5).join(", ")}` : "",
    input.topics.length ? `Topics: ${input.topics.slice(0, 5).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const system = Prompts.journeyPostsSystem;
  const readmeCompressed = summarizeReadme(input.readme, 500);
  const readmeHighlights = extractReadmeHighlights(input.readme, 14);

  const userMsg = [
    meta,
    "",
    "Top commits:",
    commitLines.join("\n") || "(none)",
    "",
    "README highlights:",
    readmeHighlights.length ? readmeHighlights.map((h) => `- ${h}`).join("\n") : "(none)",
    "",
    "README summary:",
    readmeCompressed.summary || "(empty)",
    readmeCompressed.keywords.length ? `Keywords: ${readmeCompressed.keywords.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const client = getOpenAIClient();
  const raw = await chat(client, system, userMsg, {
    temperature: 0.75,
    max_tokens: 1600,
  });

  // Strip accidental code fences
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as JourneyPost[];
    if (!Array.isArray(parsed)) throw new Error("Not an array");
    return parsed;
  } catch {
    throw new Error(`Failed to parse journey posts JSON: ${cleaned.slice(0, 200)}`);
  }
}

// ─── generateProjectShowcase ─────────────────────────────────────────────────

export async function generateProjectShowcase(input: {
  repoFullName: string;
  description: string;
  topics: string[];
  readme: string;
  commits: { sha: string; message: string; authoredAt?: string }[];
  languages: string[];
  voiceMemory?: string;
  tone?: string;
}): Promise<string> {
  const commitLines = input.commits.slice(0, 10).map((c) => {
    const first = c.message.split(/\r?\n/)[0] ?? "";
    return `- ${c.sha.slice(0, 7)}: ${first}`;
  });

  const meta = [
    input.repoFullName ? `Repo: ${input.repoFullName}` : "",
    input.description ? `Desc: ${input.description}` : "",
    input.languages.length ? `Stack: ${input.languages.slice(0, 6).join(", ")}` : "",
    input.topics.length ? `Topics: ${input.topics.slice(0, 5).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const system = Prompts.projectShowcaseSystem;
  const readmeCompressed = summarizeReadme(input.readme, 600);
  const readmeHighlights = extractReadmeHighlights(input.readme, 18);

  const userMsg = [
    meta,
    input.voiceMemory ? `Voice memory: ${input.voiceMemory}` : "",
    input.tone ? `Tone: ${toneLabel(input.tone)}` : "",
    "",
    "Top commits:",
    commitLines.join("\n") || "(none)",
    "",
    "README highlights:",
    readmeHighlights.length ? readmeHighlights.map((h) => `- ${h}`).join("\n") : "(none)",
    "",
    "README summary:",
    readmeCompressed.summary || "(empty)",
    readmeCompressed.keywords.length ? `Keywords: ${readmeCompressed.keywords.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const client = getOpenAIClient();
  const raw = await chat(client, system, userMsg, {
    temperature: 0.75,
    max_tokens: 1400,
  });
  return normalizePostVoice(raw);
}

export async function generateTrendPost(input: {
  platform: "linkedin" | "x";
  topic: string;
  headline?: string;
  trends: string[];
  devNews: string[];
  profile: {
    name?: string;
    login?: string;
    bio?: string;
    company?: string;
    location?: string;
    blog?: string;
    twitter?: string;
  };
  voiceMemory?: string;
  tone?: string;
}): Promise<string> {
  const system = Prompts.trendPostSystem(input.platform);
  const userMsg = [
    `Platform: ${input.platform}`,
    `Topic: ${input.topic}`,
    input.headline ? `Selected headline: ${input.headline}` : "",
    input.voiceMemory ? `Voice memory: ${input.voiceMemory}` : "",
    input.tone ? `Tone: ${toneLabel(input.tone)}` : "",
    input.profile.name ? `Name: ${input.profile.name}` : "",
    input.profile.login ? `Handle: ${input.profile.login}` : "",
    input.profile.bio ? `Bio: ${input.profile.bio}` : "",
    input.profile.company ? `Company: ${input.profile.company}` : "",
    input.profile.location ? `Location: ${input.profile.location}` : "",
    input.profile.blog ? `Blog: ${input.profile.blog}` : "",
    input.profile.twitter ? `Twitter: ${input.profile.twitter}` : "",
    "",
    "Recent trends:",
    input.trends.slice(0, 10).map((t) => `- ${t}`).join("\n"),
    "",
    "Recent dev news headlines:",
    input.devNews.slice(0, 10).map((n) => `- ${n}`).join("\n"),
  ]
    .filter(Boolean)
    .join("\n");

  const client = getOpenAIClient();
  const raw = await chat(client, system, userMsg, {
    temperature: 0.7,
    max_tokens: input.platform === "x" ? 220 : 700,
  });
  return normalizePostVoice(raw);
}

export async function generateTweetVariants(input: {
  title: string;
  summary: string;
  voiceMemory?: string;
  tone?: string;
  preferredTone?: string;
}): Promise<Array<{ tone: "informative" | "hot_take" | "thread_opener"; tweet: string }>> {
  const system = Prompts.tweetGeneratorSystem;
  const userMsg = [
    `Title: ${input.title}`,
    `Summary: ${input.summary}`,
    input.preferredTone ? `Preferred format: ${input.preferredTone}` : "",
    input.voiceMemory ? `Voice memory: ${input.voiceMemory}` : "",
    input.tone ? `Tone: ${toneLabel(input.tone)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const client = getOpenAIClient();
  const raw = await chat(client, system, userMsg, { temperature: 0.6, max_tokens: 500 });
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as Array<{ tone: "informative" | "hot_take" | "thread_opener"; tweet: string }>;
    if (!Array.isArray(parsed) || parsed.length !== 3) throw new Error("Invalid tweet variants");
    return parsed.map((t) => ({
      tone: t.tone,
      tweet: t.tweet?.trim?.() ?? "",
    }));
  } catch {
    throw new Error(`Failed to parse tweet variants JSON: ${cleaned.slice(0, 200)}`);
  }
}
