import { PostHog } from "posthog-node";
import type { AnalyticsEventName } from "./analytics";

type ServerEventParams = {
  distinctId: string;
  event: AnalyticsEventName;
  properties?: Record<string, unknown>;
};

export async function captureServerEvent({
  distinctId,
  event,
  properties,
}: ServerEventParams) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
  if (!apiKey) return;

  const posthog = new PostHog(apiKey, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    posthog.capture({
      distinctId,
      event,
      properties,
    });
  } finally {
    await posthog.shutdown();
  }
}
