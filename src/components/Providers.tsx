"use client";

import { SessionProvider } from "next-auth/react";
import { AppAnalytics } from "@/components/AppAnalytics";
import type { AnalyticsUser } from "@/lib/analytics";

export function Providers({
  children,
  analyticsUser,
}: {
  children: React.ReactNode;
  analyticsUser?: AnalyticsUser | null;
}) {
  return (
    <SessionProvider>
      <AppAnalytics user={analyticsUser} />
      {children}
    </SessionProvider>
  );
}
