"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import posthog from "posthog-js";
import {
  ANALYTICS_EVENTS,
  getAnalyticsPageType,
  type AnalyticsUser,
} from "@/lib/analytics";
import { initPostHog } from "@/lib/posthog-client";

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? "";
const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_TOKEN ?? "";
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
  if (typeof window === "undefined" || !window.clarity) return;
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
  const { data: session } = useSession();
  const resolvedUser = useMemo(
    () =>
      user ??
      (session?.user?.id
        ? {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            plan: "unknown",
          }
        : null),
    [session, user],
  );
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const identifiedUserRef = useRef<string | null>(null);

  useEffect(() => {
    const authState = resolvedUser?.id ? "authenticated" : "anonymous";
    const plan = resolvedUser?.plan ?? "anonymous";

    analyticsContext = {
      userId: resolvedUser?.id,
      email: resolvedUser?.email,
      name: resolvedUser?.name,
      authState,
      plan,
    };

    if (initPostHog()) {
      posthog.register({ auth_state: authState, plan });
    }

    if (resolvedUser?.id && initPostHog()) {
      if (identifiedUserRef.current !== resolvedUser.id) {
        posthog.identify(resolvedUser.id, {
          email: resolvedUser.email ?? undefined,
          name: resolvedUser.name ?? undefined,
          plan: resolvedUser.plan,
        });
        sendPostHogEvent("$identify", {
          $anon_distinct_id: getAnonymousId(),
          $set: {
            email: resolvedUser.email ?? undefined,
            name: resolvedUser.name ?? undefined,
            plan: resolvedUser.plan,
          },
        });
        captureAnalyticsEvent(ANALYTICS_EVENTS.authCompleted, {
          plan: resolvedUser.plan,
        });
      }

      if (window.clarity) {
        window.clarity(
          "identify",
          resolvedUser.id,
          undefined,
          undefined,
          resolvedUser.email ?? resolvedUser.name ?? resolvedUser.id,
        );
      }
    }

    identifiedUserRef.current = resolvedUser?.id ?? null;

    setClarityTag("auth_state", authState);
    setClarityTag("plan", plan);
  }, [resolvedUser]);

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams.toString();
    const pageType = getAnalyticsPageType(pathname);
    const currentUrl = `${window.location.origin}${query ? `${pathname}?${query}` : pathname}`;

    captureAnalyticsEvent("$pageview", {
      $current_url: currentUrl,
      page_type: pageType,
    });

    setClarityTag("pathname", pathname);
    setClarityTag("page_type", pageType);
  }, [pathname, searchParams, resolvedUser?.id, resolvedUser?.plan]);

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
