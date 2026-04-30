# Postmate

Turn GitHub commits into LinkedIn and X posts - in your voice.

## What it is

**Postmate** is a Next.js app that turns your GitHub activity into ready-to-post drafts (LinkedIn + X) and helps you ship consistently:

- Sync recent commits from a connected repo (read-only GitHub OAuth)
- Generate posts from a single commit (diff-aware: files changed + patch snippets when available)
- Generate higher-level content from your repo (showcase, journey thread, trend/news tie-in)
- Run a curated developer-news pipeline that drafts posts and queues them for review

## Features (exactly what's implemented)

### GitHub -> posts

- **GitHub OAuth (read-only)** via NextAuth + Octokit; connects 1+ repos and marks one as active
- **Auto-sync commits** (last ~20) on dashboard load; stored in `GitHubEvent`
- **Single-commit post generation** for **LinkedIn or X**, with styles:
 - `progress`
 - `insight` (Pro)
 - `build_in_public` (Pro)
 - `project_showcase` (Pro)
 - `trend` (Pro)
- **Commit clustering -> multiple drafts**: groups recent commits into themes and generates one draft per cluster (Pro)
- **Post editor workflow**: save edits, track status (`draft` -> `copied` -> `posted`), and re-score writing quality (hook/clarity/CTA + tips)

### Voice system

- **Voice memory** + **tone** applied to every generation
- **Auto voice fingerprint**: derives a starter "voice memory" from your GitHub profile, repo descriptions, recent commit messages, and README excerpts (Pro)

### Visuals (post image helper)

- **Find a relevant image** by:
 - extracting non-badge images from the repo README (resolved to raw GitHub URLs), or
 - taking a **Playwright screenshot** of the repo's homepage / first external site URL found in the README

### LinkedIn (optional)

- **Connect LinkedIn** (OIDC scopes: `openid profile email w_member_social`)
- **Post to LinkedIn now** for:
 - generated commit posts, and
 - news drafts
- **Schedule LinkedIn posts** (stored in DB) and publish them via a cron endpoint (`/api/cron/linkedin`)
- **Auto-post approved news** to LinkedIn when `linkedinAutoPost` is enabled

### News pipeline (Pro)

- **Fetch + dedupe** RSS + Hacker News (Algolia search + high-signal queries)
- **Recency filter** (keeps roughly the last 7 days of RSS items when dates exist)
- **AI impact scoring (1-10)**; only **scores ≥ 8** enter the queue (unless you use keyword filtering, which skips AI scoring)
- **Queue UI** at `/news`: approve/reject/edit/regenerate, plus schedule/post-to-LinkedIn
- **History UI** at `/news/history`
- **Auto-fetch** via cron endpoint (`/api/cron/news`) when `newsAutoFetch` is enabled
- **Email digest** (Resend): optional notifications on new items + manual "send digest now" from settings

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in:

```bash
# Database (PostgreSQL recommended)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace_me_with_a_long_random_string"

# GitHub OAuth App (read-only)
GITHUB_CLIENT_ID="replace_me"
GITHUB_CLIENT_SECRET="replace_me"

# Groq API (LLM generation; OpenAI-compatible)
GROQ_API_KEY="replace_me"

# LinkedIn (optional; enables posting + scheduling)
LINKEDIN_CLIENT_ID="..."
LINKEDIN_CLIENT_SECRET="..."
LINKEDIN_REDIRECT_URI="http://localhost:3000/api/auth/linkedin/callback"

# Cron protection (optional, recommended in production)
CRON_SECRET="replace_me_with_random_32_char_hex"

# Optional: email digest for news queue
RESEND_API_KEY="re_replace_me"
RESEND_FROM_EMAIL="you@yourdomain.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Paddle (optional; enables Pro billing flow)
PADDLE_API_KEY="pdl_live_or_sandbox_api_key"
PADDLE_PRO_PRICE_ID="pri_replace_me"
PADDLE_PRO_YEARLY_PRICE_ID="pri_replace_me"
PADDLE_CUSTOMER_PORTAL_URL="https://vendors.paddle.com/subscription/portal"
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
npm run dev # Start dev server
npm run build # prisma generate && next build
npm run start # Production server
npm run lint # ESLint
npx prisma migrate dev # Run migrations
npx prisma studio # Open Prisma GUI
```

## Architecture

**Stack:** Next.js 16 App Router - React 19 - Prisma (PostgreSQL) - NextAuth v4 - Groq (OpenAI-compatible) - Tailwind CSS - Playwright (screenshots) - Paddle (billing)

### Data flow

1. **Sign in**: NextAuth stores OAuth tokens in `Account` via `@auth/prisma-adapter`.
2. **Connect repo**: set active repo in `/settings`.
3. **Sync commits**: dashboard fetches recent commits -> persisted as `GitHubEvent`.
4. **Generate drafts**: server actions call `src/lib/ai.ts` -> Groq -> persisted as `GeneratedPost`.
5. **News ingest**: RSS + HN -> dedupe + scoring -> persisted as `NewsTweet` (review in `/news`).
6. **LinkedIn publish**: manual post, auto-post-on-approve, or scheduled via `/api/cron/linkedin`.

### Key directories

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages and API routes |
| `src/app/*/actions.ts` | Server actions (mutations, AI calls) |
| `src/lib/ai.ts` | Groq-backed generation + scoring |
| `src/lib/github.ts` | Octokit wrapper + repo context builders |
| `src/lib/news-rss.ts` | RSS parsing, keyword filtering, deduplication |
| `src/lib/news-ingest.ts` | News fetching + scoring + queue persistence |
| `src/lib/linkedin.ts` | LinkedIn OAuth + posting |
| `src/components/` | Shared UI components |
| `prisma/schema.prisma` | Database schema |

## Operational notes

### Cron endpoints

- `/api/cron/news`: ingests news for users with `newsAutoFetch=true` and optionally emails a digest
- `/api/cron/linkedin`: posts any due scheduled LinkedIn items
- Set `CRON_SECRET` to require a bearer/header/query secret for both endpoints.

### Posting behavior

- **X**: drafts are generated for X, but posting is manual (intent/share flow).
- **LinkedIn**: can post immediately or schedule to post later (requires LinkedIn connection).
- **GitHub access**: read-only; Postmate never writes to your repos.
