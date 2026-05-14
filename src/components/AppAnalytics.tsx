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

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? "";
const isPostHogEnabled = !!process.env.NEXT_PUBLIC_POSTHOG_TOKEN;

function setClarityTag(key: string, value: string) {
  if (typeof window === "undefined" || !window.clarity) return;
  window.clarity("set", key, value);
}

export function captureAnalyticsEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (!isPostHogEnabled) return;
  posthog.capture(event, properties);
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

    if (isPostHogEnabled) {
      posthog.register({ auth_state: authState, plan });
    }

    if (isPostHogEnabled && resolvedUser?.id) {
      if (identifiedUserRef.current !== resolvedUser.id) {
        posthog.identify(resolvedUser.id, {
          email: resolvedUser.email ?? undefined,
          name: resolvedUser.name ?? undefined,
          plan: resolvedUser.plan,
        });
        posthog.capture(ANALYTICS_EVENTS.authCompleted, {
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
