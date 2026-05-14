"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import {
  ANALYTICS_EVENTS,
  getAnalyticsPageType,
  type AnalyticsUser,
} from "@/lib/analytics";

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_TOKEN ?? "";
const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? "";
const anonymousIdKey = "postmate_anonymous_id";

type ClientAnalyticsContext = {
  userId?: string;
  email?: string | null;
  name?: string | null;
  authState: "anonymous" | "authenticated";
  plan: string;
};

let analyticsContext: ClientAnalyticsContext = {
  authState: "anonymous",
  plan: "anonymous",
};

function getAnonymousId() {
  if (typeof window === "undefined") return "server";

  const existing = window.localStorage.getItem(anonymousIdKey);
  if (existing) return existing;

  const id =
    window.crypto?.randomUUID?.() ??
    `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(anonymousIdKey, id);
  return id;
}

function getUtmProperties() {
  const params = new URLSearchParams(window.location.search);
  const properties: Record<string, string> = {};

  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const value = params.get(key);
    if (value) properties[key] = value;
  }

  return properties;
}

function setClarityTag(key: string, value: string) {
  if (!window.clarity) return;
  window.clarity("set", key, value);
}

function sendPostHogEvent(event: string, properties?: Record<string, unknown>) {
  if (!posthogToken || typeof window === "undefined") return;

  const anonymousId = getAnonymousId();
  const distinctId = analyticsContext.userId ?? anonymousId;
  const payload = {
    api_key: posthogToken,
    event,
    distinct_id: distinctId,
    properties: {
      $anon_distinct_id: anonymousId,
      $current_url: window.location.href,
      $host: window.location.host,
      $pathname: window.location.pathname,
      $referrer: document.referrer || undefined,
      auth_state: analyticsContext.authState,
      plan: analyticsContext.plan,
      ...getUtmProperties(),
      ...properties,
    },
  };
  const body = JSON.stringify(payload);
  const url = "/ingest/capture/";

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon(url, blob)) return;
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export function captureAnalyticsEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  sendPostHogEvent(event, properties);
}

export function AppAnalytics({ user }: { user?: AnalyticsUser | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const identifiedUserRef = useRef<string | null>(null);

  useEffect(() => {
    const authState = user?.id ? "authenticated" : "anonymous";
    const plan = user?.plan ?? "anonymous";

    analyticsContext = {
      userId: user?.id,
      email: user?.email,
      name: user?.name,
      authState,
      plan,
    };

    if (user?.id) {
      if (identifiedUserRef.current !== user.id) {
        sendPostHogEvent("$identify", {
          $anon_distinct_id: getAnonymousId(),
          $set: {
            email: user.email ?? undefined,
            name: user.name ?? undefined,
            plan: user.plan,
          },
        });
        captureAnalyticsEvent(ANALYTICS_EVENTS.authCompleted, {
          plan: user.plan,
        });
      }

      if (window.clarity) {
        window.clarity(
          "identify",
          user.id,
          undefined,
          undefined,
          user.email ?? user.name ?? user.id,
        );
      }
    }

    identifiedUserRef.current = user?.id ?? null;

    setClarityTag("auth_state", authState);
    setClarityTag("plan", plan);
  }, [user]);

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams.toString();
    const pageType = getAnalyticsPageType(pathname);
    const currentUrl = `${window.location.origin}${query ? `${pathname}?${query}` : pathname}`;

    captureAnalyticsEvent("$pageview", {
      $current_url: currentUrl,
      page_type: pageType,
      auth_state: user?.id ? "authenticated" : "anonymous",
      plan: user?.plan ?? "anonymous",
    });

    setClarityTag("pathname", pathname);
    setClarityTag("page_type", pageType);
  }, [pathname, searchParams, user?.id, user?.plan]);

  return clarityProjectId ? (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityProjectId}");
        `,
      }}
    />
  ) : null;
}
