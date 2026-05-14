<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Postmate. Here is a summary of all changes made:

## Changes summary

- **`instrumentation-client.ts`** (new): PostHog client-side initialization using the Next.js 15.3+ recommended pattern (`instrumentation-client.ts`). Enables autocapture, exception tracking, pageview capture, and a reverse proxy via `/ingest`.
- **`next.config.ts`**: Added PostHog reverse proxy rewrites (`/ingest/*` → PostHog US ingestion endpoints) and `skipTrailingSlashRedirect: true`. This improves event delivery reliability and ad-blocker resistance.
- **`src/components/AppAnalytics.tsx`**: Removed the `posthog.init()` call (now handled by `instrumentation-client.ts`) and the unused `posthogHost` constant. Identify, pageview capture, and Clarity integration remain intact.
- **`src/lib/analytics.ts`**: Added 13 new event name constants to `ANALYTICS_EVENTS` covering post generation, content publishing, repo connection, and news feature actions.
- **`.env`**: Added `NEXT_PUBLIC_POSTHOG_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` environment variables.
- **`src/app/dashboard/actions.ts`**: Added `captureServerEvent` calls for `post_generated` (all 5 generation flows), `commits_synced`, and `voice_settings_saved`.
- **`src/app/settings/actions.ts`**: Added `captureServerEvent` call for `repo_connected` (key activation event).
- **`src/app/posts/actions.ts`**: Added `captureServerEvent` calls for `post_copied`, `post_published`, `post_scheduled`, and `post_regenerated`.
- **`src/app/news/actions.ts`**: Added `captureServerEvent` calls for `news_fetched`, `news_tweet_approved`, `news_tweet_rejected`, and `news_tweet_posted`.

## Event tracking table

| Event name | Description | File |
|---|---|---|
| `post_generated` | Fired when a user generates any AI post (commit, showcase, trend, clustered, suggested) | `src/app/dashboard/actions.ts` |
| `commits_synced` | Fired when a user manually syncs recent commits from GitHub | `src/app/dashboard/actions.ts` |
| `voice_settings_saved` | Fired when a user saves their voice/tone settings | `src/app/dashboard/actions.ts` |
| `repo_connected` | Fired when a user sets a GitHub repo as active (key activation event) | `src/app/settings/actions.ts` |
| `post_copied` | Fired when a user copies a generated post to clipboard | `src/app/posts/actions.ts` |
| `post_published` | Fired when a user publishes a post directly to LinkedIn | `src/app/posts/actions.ts` |
| `post_scheduled` | Fired when a user schedules a post for future LinkedIn publishing | `src/app/posts/actions.ts` |
| `post_regenerated` | Fired when a user regenerates an existing post | `src/app/posts/actions.ts` |
| `news_fetched` | Fired when a user triggers a news ingest from RSS feeds | `src/app/news/actions.ts` |
| `news_tweet_approved` | Fired when a user approves a news tweet | `src/app/news/actions.ts` |
| `news_tweet_rejected` | Fired when a user rejects a news tweet | `src/app/news/actions.ts` |
| `news_tweet_posted` | Fired when a user posts a news tweet to LinkedIn immediately | `src/app/news/actions.ts` |

*Pre-existing events (already tracked before this integration):* `auth_started`, `auth_completed`, `pricing_viewed`, `pricing_billing_interval_changed`, `pricing_plan_selected`, `checkout_created`, `checkout_closed`, `checkout_page_viewed`, `trial_started`, `billing_portal_opened`, `subscription_activated`, `subscription_canceled`.

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1580208)
- [Pricing-to-subscription funnel](/insights/0jZNMdO3) — tracks conversion from pricing page view → checkout created → subscription activated
- [Post generation trend](/insights/F4huEkM7) — total posts generated and unique generating users per day
- [User activation funnel](/insights/ghM2DNGn) — onboarding drop-off: signup → repo connected → first post generated
- [Content publishing actions](/insights/Q0ADpJg7) — posts copied, published to LinkedIn, and scheduled over time
- [Subscription churn vs activation](/insights/0ReFjEaB) — trials started, subscriptions activated, and cancellations side by side

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
