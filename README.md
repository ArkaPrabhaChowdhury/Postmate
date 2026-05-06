# Postmate

Turn GitHub shipping activity into LinkedIn and X drafts in your own voice.

## What it does

Postmate is a Next.js app that connects to GitHub, syncs recent commits from one active repo, and generates social posts from real repo context:

- Commit-based LinkedIn or X drafts
- Repo-level showcase and journey content
- Trend/news-based post generation
- LinkedIn posting and scheduling
- Pro-gated news queue, digest, and automation

## What is implemented

### GitHub and repo workflow

- GitHub OAuth via NextAuth
- Repo picker from the authenticated user account, plus manual `owner/repo` or GitHub URL entry
- One active repo at a time per user
- Automatic recent-commit sync on dashboard load, plus manual sync actions
- Commit context includes changed files and patch snippets when GitHub returns them

### AI post generation

- Single-commit draft generation for `linkedin` and `x`
- Supported styles:
  - `progress`
  - `insight` (Pro)
  - `build_in_public` (Pro)
  - `project_showcase` (Pro)
  - `trend` (Pro)
- Commit clustering into multiple draft posts (Pro)
- Suggested-post generation from a scored commit candidate
- Post scoring after generation: hook, clarity, CTA, plus short improvement tips
- Regeneration with an additional prompt

### Voice system

- Saved voice memory
- Saved tone preference
- Auto-generated voice fingerprint from GitHub profile, repo descriptions, commit messages, and README excerpts
- Owner-only global prompt override backed by `OWNER_PROMPT_ADMIN_EMAIL`

### Post editing and publishing

- Draft editor with save/regenerate flows
- Draft status tracking: `draft`, `copied`, `posted`
- LinkedIn direct posting for generated drafts
- LinkedIn scheduling for generated drafts
- X generation is supported, but X posting stays manual
- X 280-character enforcement is user-configurable in settings, with the toggle effectively reserved for Pro/X Premium use cases

### Repo-level content

- LinkedIn project showcase generation from repo context (Pro)
- Journey-post generation for X-style story arcs, stored per repo (Pro)
- Trend post generation from repo context, current trends, dev news, and GitHub profile data (Pro)

### Visual helper

- Finds a likely post image from README images first
- Falls back to a Playwright screenshot of the repo homepage or first relevant external URL

### News pipeline

- Pro-only news ingestion and queue management
- Source mix includes official AI lab blogs, official dev blogs, GitHub Trending, Hacker News, and other developer/news sources defined in code
- Keyword-based filtering plus AI scoring
- Queue UI for approve, reject, edit, regenerate, schedule, and post-now workflows
- History page for reviewed/posted news items
- Optional email notifications for newly queued items
- Manual "send digest now" action from news settings
- Queue flush / reset action

### Billing and access control

- Free and Pro plans
- Free plan limit: 5 generated posts per month, `progress` style only
- Paddle checkout, portal, and webhook integration
- 3-day Pro trial flow
- Automatic trial expiry handling and downgrade back to free
- Plan gates enforced in server actions, not only in the UI

### Operational routes

- `/api/cron/news`
- `/api/cron/linkedin`
- `/api/cron/trials`
- `/api/cron/weekly-digest`
- `/api/paddle/checkout`
- `/api/paddle/portal`
- `/api/paddle/webhook`
- `/api/trial/start`
- `/api/support`

## Stack

- Next.js 16 App Router
- React 19
- Prisma
- NextAuth v4
- Octokit
- Groq via the OpenAI-compatible SDK
- Paddle
- Resend
- Playwright
- Tailwind CSS 4
- Framer Motion

## Environment

Copy `.env.example` to `.env`.

### Required for local auth + generation

```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace_me_with_a_long_random_string"

GITHUB_CLIENT_ID="replace_me"
GITHUB_CLIENT_SECRET="replace_me"

GROQ_API_KEY="replace_me"
```

### Database

Local SQLite example:

```bash
DATABASE_URL="file:./dev.db"
```

Postgres / Neon example:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@YOUR-PROJECT-pooler.REGION.aws.neon.tech/DB?sslmode=require&pgbouncer=true&connection_limit=1&pool_timeout=0"
DIRECT_DATABASE_URL="postgresql://USER:PASSWORD@YOUR-PROJECT.REGION.aws.neon.tech/DB?sslmode=require"
```

### Optional integrations

```bash
LINKEDIN_CLIENT_ID="replace_me"
LINKEDIN_CLIENT_SECRET="replace_me"
LINKEDIN_REDIRECT_URI="http://localhost:3000/api/auth/linkedin/callback"

CRON_SECRET="replace_me_with_random_32_char_hex"

RESEND_API_KEY="re_replace_me"
RESEND_FROM_EMAIL="you@yourdomain.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

PADDLE_API_KEY="pdl_sandbox_replace_me"
PADDLE_API_BASE_URL="https://sandbox-api.paddle.com"
PADDLE_PRO_PRICE_ID="pri_replace_me"
PADDLE_PRO_YEARLY_PRICE_ID="pri_replace_me"
PADDLE_WEBHOOK_SECRET="pdlntfset_replace_me"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_replace_me"
NEXT_PUBLIC_PADDLE_ENV="sandbox"

OWNER_PROMPT_ADMIN_EMAIL="owner@example.com"
```

Notes:

- `.env.example` also contains `GOOGLE_GENAI_API_KEY`, but the active generation path in the current code uses Groq.
- Create a GitHub OAuth app with callback `http://localhost:3000/api/auth/callback/github`.

## Local setup

```bash
npm install
```

For local SQLite:

```bash
npx prisma db push
```

For Postgres with migrations:

```bash
npx prisma migrate dev
```

Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npx prisma migrate dev
npx prisma db push
npx prisma studio
npx tsc -p tsconfig.json --noEmit
```

`npx tsc -p tsconfig.json --noEmit` is the most reliable repo-level verification command for this project when lint/build are noisy or Prisma is file-locked on Windows.

## Data model overview

- `User`: auth identity, plan, Paddle fields, trial lifecycle fields
- `UserSettings`: voice/tone, owner prompt override, news settings, X length setting
- `Repo`: saved repos with one active repo per user
- `GitHubEvent`: synced commit metadata
- `GeneratedPost`: generated post drafts, status, platform, LinkedIn scheduling state
- `ProjectStrategy`: stored journey-post JSON per repo
- `NewsTweet`: queued news drafts and LinkedIn scheduling/post state
- `SeenUrl`: dedupe/history for news ingestion

## Posting behavior

- GitHub access is read-only
- LinkedIn supports direct posting and scheduling
- X supports generation only; publishing is manual
- News auto-posting applies to LinkedIn only

## Cron behavior

- `/api/cron/news`: fetches news for users with auto-fetch enabled
- `/api/cron/linkedin`: publishes due scheduled LinkedIn items
- `/api/cron/trials`: expires finished trials and returns users to the free plan
- `/api/cron/weekly-digest`: emails a weekly shipping digest for active repos

If `CRON_SECRET` is set, cron routes accept:

- `Authorization: Bearer <secret>`
- `X-Cron-Secret: <secret>`
- `?secret=<secret>`
