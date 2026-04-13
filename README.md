# Postmate

Turn GitHub commits into LinkedIn and X posts — in your voice.

## What it does

**Postmate** is a Next.js app that reads your GitHub activity and uses AI to generate social media content. It connects with GitHub OAuth (read-only), pulls commit history and repo context, and generates polished drafts via Groq's LLM API.

### Generation modes

- **Single commit post** — pick a commit, choose a style (progress update, technical insight, or build-in-public), get a LinkedIn-ready draft
- **Project showcase** — AI reads your full repo (README, commits, languages) and writes a comprehensive LinkedIn post
- **X journey thread** — 3-post arc covering your project from origin → build → launch
- **Trend post** — ties your work to live Google Trends topics or news headlines; outputs LinkedIn or X format
- **News-to-tweet** — ingests 15+ RSS feeds (TechCrunch, Hacker News, Anthropic, OpenAI, etc.), generates tweet variants per article, queues them for your review

### Voice & tone system

Set a **voice memory** prompt (your writing quirks, phrases to use/avoid) and a **tone slider** (0 = concise, 100 = bold). Applied to every generated post.

### News queue

The `/news` page shows pending tweet drafts grouped by article. Approve, reject, or mark as posted. History is tracked at `/news/history`. Configure RSS sources, keyword filters, and exclusion lists at `/news/settings`.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in:

```bash
# Database (PostgreSQL via Neon, or SQLite for local dev)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth App (read-only scope)
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Groq API (LLM generation — llama-3.3-70b-versatile)
GROQ_API_KEY="..."

# Optional: email notifications for news queue
RESEND_API_KEY="..."
```

Create a GitHub OAuth App at `github.com/settings/developers`. Set the callback URL to `http://localhost:3000/api/auth/callback/github`.

### 3. Database

```bash
npx prisma migrate dev --name init
# or for quick local setup:
npx prisma db push
```

### 4. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Commands

```bash
npm run dev          # Start dev server (Next.js + Turbopack)
npm run build        # prisma generate && next build
npm run start        # Production server
npm run lint         # ESLint
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open Prisma GUI
```

## Architecture

**Stack:** Next.js 16 App Router · PostgreSQL (Neon) · Prisma · NextAuth v4 · Groq API · Tailwind CSS

### Data flow

1. **GitHub OAuth** (NextAuth, `database` strategy) — access token stored in `Account` table via `@auth/prisma-adapter`
2. **Repo sync** — user selects repo in `/settings` → Octokit fetches commits, README, languages → stored as `GitHubEvent` rows
3. **Post generation** — server actions in `src/app/*/actions.ts` call functions in `src/lib/ai.ts` → Groq API → stored as `GeneratedPost`
4. **News ingestion** — RSS feeds parsed in `src/lib/news-rss.ts` → tweet variants generated → stored as `NewsTweet` (pending review at `/news`)

### Key directories

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages and API routes |
| `src/app/*/actions.ts` | Server actions (mutations, AI calls) |
| `src/lib/ai.ts` | All Groq generation functions |
| `src/lib/github.ts` | Octokit wrapper, repo context builders |
| `src/lib/news-rss.ts` | RSS ingestion, keyword filtering, deduplication |
| `src/lib/prompts.ts` | LLM system prompts |
| `src/components/` | Shared UI components |
| `prisma/schema.prisma` | Database schema |

### AI functions (`src/lib/ai.ts`)

| Function | Input | Output |
|----------|-------|--------|
| `generateLinkedInPost()` | commit + style | single LinkedIn post |
| `generateProjectShowcase()` | full repo context | comprehensive LinkedIn post |
| `generateJourneyPosts()` | repo context | 3-post JSON arc (origin/build/launch) |
| `generateProjectStrategy()` | repo context | markdown strategy guide |
| `generateTrendPost()` | trend/headline + profile | LinkedIn or X post |
| `generateTweetVariants()` | article title | 3 tweet variants (informative / hot take / thread opener) |

All functions use Groq's OpenAI-compatible endpoint (`llama-3.3-70b-versatile`), have 3-attempt retry logic with 1s backoff, and apply the user's `voiceMemory` and `tone` settings.

## Posting

Postmate does **not** auto-post. All generation is manual:

- LinkedIn: draft is copied to clipboard and LinkedIn feed opens in a new tab
- X/Twitter: opens `twitter.com/intent/tweet` with the post pre-filled

Read-only GitHub OAuth means we never touch your repos.
