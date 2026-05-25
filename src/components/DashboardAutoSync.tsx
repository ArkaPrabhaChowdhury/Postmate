"use client";

import { useEffect, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";

type DashboardAutoSyncProps = {
  repoId: string;
};

export function DashboardAutoSync({ repoId }: DashboardAutoSyncProps) {
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const syncKey = `postmate-sync-${repoId}`;
    const lastStartedAt = Number(window.sessionStorage.getItem(syncKey) ?? "0");
    const now = Date.now();

    if (now - lastStartedAt < 60_000) return;
    window.sessionStorage.setItem(syncKey, String(now));

    void fetch("/api/github/sync-commits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ synced?: boolean }>;
      })
      .then((data) => {
        if (data?.synced) {
          startTransition(() => {
            router.refresh();
          });
        }
      })
      .catch(() => {});
  }, [repoId, router]);

  return null;
}
