"use client";

import { useState, useTransition } from "react";
import { sendManualDigest } from "../actions";

export function SendDigestButton() {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function handleClick() {
    setMsg(null);
    startTransition(async () => {
      const result = await sendManualDigest();
      setMsg(result.ok ? { ok: true, text: "Email sent!" } : { ok: false, text: result.error ?? "Failed." });
    });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-[#f0ede8] text-sm font-semibold rounded-xl transition-colors shrink-0 disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Send digest now"}
      </button>
      {msg && (
        <span className={`text-xs ${msg.ok ? "text-[#d4ff00]" : "text-red-400"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
