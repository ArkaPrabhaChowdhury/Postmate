"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import posthog from "posthog-js";
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

function setClarityTag(key: string, value: string) {
  if (!window.clarity) return;
  window.clarity("set", key, value);
}

export function captureAnalyticsEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (!posthogToken) return;
  posthog.capture(event, properties);
}

export function AppAnalytics({ user }: { user?: AnalyticsUser | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const identifiedUserRef = useRef<string | null>(null);

  // PostHog is initialized in instrumentation-client.ts (Next.js 15.3+ pattern)

  useEffect(() => {
    if (!posthogToken) return;

    const authState = user?.id ? "authenticated" : "anonymous";
    const plan = user?.plan ?? "anonymous";

    posthog.register({
      auth_state: authState,
      plan,
    });

    if (user?.id) {
      posthog.identify(user.id, {
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        plan: user.plan,
      });

      if (identifiedUserRef.current !== user.id) {
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
    } else if (identifiedUserRef.current) {
      posthog.reset();
    }

    identifiedUserRef.current = user?.id ?? null;

    setClarityTag("auth_state", authState);
    setClarityTag("plan", plan);
  }, [user]);

  useEffect(() => {
    if (!posthogToken || !pathname) return;

    const query = searchParams.toString();
    const pageType = getAnalyticsPageType(pathname);
    const currentUrl = query ? `${pathname}?${query}` : pathname;

    posthog.capture("$pageview", {
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
