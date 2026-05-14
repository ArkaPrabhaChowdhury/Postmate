import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  capture_pageview: false,
  capture_pageleave: true,
  person_profiles: "identified_only",
  debug: process.env.NODE_ENV === "development",
});

// IMPORTANT: Never combine this with other client-side PostHog initialization
// approaches (e.g. a PostHogProvider). instrumentation-client.ts is the correct
// solution for initializing client-side PostHog in Next.js 15.3+ apps.
