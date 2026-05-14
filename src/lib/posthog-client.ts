import posthog from "posthog-js";

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;

let hasInitialized = false;

export function initPostHog() {
  if (!posthogToken || typeof window === "undefined") return false;

  const client = posthog as unknown as { __loaded?: boolean };
  if (hasInitialized || client.__loaded) return true;

  posthog.init(posthogToken, {
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    capture_pageview: false,
    debug: process.env.NODE_ENV === "development",
  });

  hasInitialized = true;
  return true;
}

