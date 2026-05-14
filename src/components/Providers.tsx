"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { AppAnalytics } from "@/components/AppAnalytics";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <AppAnalytics />
      </Suspense>
      {children}
    </SessionProvider>
  );
}
