# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (Next.js with Turbopack)
npm run build        # prisma generate && next build
npm run start        # Production server
npm run lint         # ESLint check
npx prisma migrate dev   # Run DB migrations in development
npx prisma studio        # Open Prisma GUI
```

## Architecture

**Postmate** is a Next.js 16 App Router application that transforms GitHub commit activity into AI-generated social media posts (LinkedIn, X/Twitter). It uses GitHub OAuth for authentication, reads commit history via Octokit, and generates content using Groq's LLM API (llama-3.3-70b-versatile).

### Key Data Flow

1. **GitHub OAuth** (NextAuth v4, `database` session strategy) → Access token stored in `Account` table via `@auth/prisma-adapter`
2. **Repo sync** → User selects a repo in `/settings` → Octokit fetches commits/README/languages → stored as `GitHubEvent` rows
3. **Post generation** → Server actions in `src/app/*/actions.ts` call functions in `src/lib/ai.ts` → Groq API → stored as `GeneratedPost`
4. **News tweets** → RSS feeds fetched/filtered in `src/lib/news-rss.ts` → tweet variants generated → stored as `NewsTweet` (pending review at `/news`)

### Directory Map

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages and API routes |
| `src/app/*/actions.ts` | Server actions (mutations, AI calls) |
| `src/lib/ai.ts` | All Groq LLM generation functions |
| `src/lib/github.ts` | Octokit wrapper, repo context builders |
| `src/lib/news-rss.ts` | RSS ingestion, keyword filtering, deduplication |
| `src/lib/prompts.ts` | All LLM system prompts and templates |
| `src/lib/auth.ts` | NextAuth config with GitHub provider |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/requireUser.ts` | Auth guard for server actions |
| `src/components/ui/` | shadcn components |
| `prisma/schema.prisma` | Database schema |

### AI Generation Functions (`src/lib/ai.ts`)

- `generateLinkedInPost()` — single commit → LinkedIn post (styles: `progress`, `insight`, `build_in_public`, `project_showcase`)
- `generateProjectStrategy()` — repo context → markdown strategy guide
- `generateJourneyPosts()` — repo context → 3-post arc (`origin`, `build`, `launch`) as JSON array
- `generateProjectShowcase()` — repo context → technical showcase post
- `generateTrendPost()` — trend/news + user profile → opinion post for LinkedIn or X
- `generateTweetVariants()` — article title → 3 tweet variants (tones: `informative`, `hot_take`, `thread_opener`)

All functions use the OpenAI-compatible Groq endpoint, have 3-attempt retry logic (1s backoff, skip non-429 4xx errors), and respect `UserSettings.voiceMemory` and `UserSettings.tone`.

### Database Models

Core models: `User`, `Account`, `Session`, `Repo`, `GitHubEvent`, `GeneratedPost`, `ProjectStrategy`, `UserSettings`, `NewsTweet`, `SeenUrl`. All user-owned models cascade-delete on user deletion.

### Environment Variables

Copy `.env.example` to `.env`. Required:
- `DATABASE_URL` — PostgreSQL (Neon) or `file:./dev.db` for SQLite dev
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `GROQ_API_KEY` — for LLM generation (primary AI provider)
- `GOOGLE_GENAI_API_KEY` — listed in example, optional fallback

### Auth Pattern

Protected server actions call `requireUserId()` from `src/lib/requireUser.ts` which reads the NextAuth session and throws if unauthenticated. The GitHub access token is retrieved from the `Account` table (not the session) when making Octokit calls.
