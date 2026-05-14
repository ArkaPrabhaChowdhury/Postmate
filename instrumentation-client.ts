import posthog from "posthog-js";

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;

if (posthogToken) {
  posthog.init(posthogToken, {
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    capture_pageview: false,
    debug: process.env.NODE_ENV === "development",
  });
}
