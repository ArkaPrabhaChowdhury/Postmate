"use client";

import { useMemo, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    Paddle?: {
      Environment: {
        set: (environment: "sandbox" | "production") => void;
      };
      Initialize: (options: {
        token: string;
        checkout?: {
          settings?: {
            displayMode?: "overlay" | "inline";
            theme?: "light" | "dark";
            locale?: string;
            successUrl?: string;
          };
        };
        eventCallback?: (event: { name?: string }) => void;
      }) => void;
    };
  }
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const paddleClientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";
const isSandbox = (process.env.NEXT_PUBLIC_PADDLE_ENV ?? "").toLowerCase() === "sandbox";

export default function PaddlePaymentLinkClient() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const transactionId = searchParams.get("_ptxn");
  const successUrl = useMemo(() => `${appUrl}/dashboard?upgraded=1`, []);

  function initializePaddle() {
    if (!window.Paddle) {
      setError("Paddle.js failed to load.");
      return;
    }

    if (!paddleClientToken) {
      setError("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is missing.");
      return;
    }

    if (!transactionId) {
      setError("Missing Paddle transaction id.");
      return;
    }

    try {
      if (isSandbox) {
        window.Paddle.Environment.set("sandbox");
      }

      window.Paddle.Initialize({
        token: paddleClientToken,
        checkout: {
          settings: {
            displayMode: "overlay",
            theme: "dark",
            locale: "en",
            successUrl,
          },
        },
        eventCallback: (event) => {
          if (event.name === "checkout.closed") {
            window.location.href = "/pricing";
          }
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize Paddle.");
    }
  }

  return (
    <div className="min-h-screen bg-[#090909] text-[#f0ede8]">
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onReady={initializePaddle}
      />

      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="w-full rounded-3xl border border-white/[0.08] bg-[#0d0d0d] p-8 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
          <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.3em] text-[#d4ff00]">
            Secure checkout
          </p>
          <h1 className="text-3xl font-extrabold tracking-[-0.04em]" style={{ fontFamily: "var(--font-syne)" }}>
            Opening Paddle checkout
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#777]">
            Your payment form should open automatically. If it does not, check the client-side token and try again.
          </p>

          {transactionId && (
            <p className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-xs font-mono text-[#9a9a9a]">
              Transaction: {transactionId}
            </p>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={initializePaddle}
              className="inline-flex items-center rounded-xl bg-[#d4ff00] px-4 py-2 text-sm font-bold text-[#090909] transition-colors hover:bg-[#c4ef00]"
            >
              Retry checkout
            </button>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[#bbb] transition-colors hover:bg-white/[0.07] hover:text-[#f0ede8]"
            >
              Back to pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
