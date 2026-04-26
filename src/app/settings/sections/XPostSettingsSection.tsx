"use client";

import { useState, useTransition } from "react";
import { Twitter } from "lucide-react";
import { saveXSettings } from "../actions";
import { XLogo } from "@/components/XLogo";

export default function XPostSettingsSection({
  xEnforce280,
  isPro,
}: {
  xEnforce280: boolean;
  isPro: boolean;
}) {
  const [enforce, setEnforce] = useState(xEnforce280);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!isPro && enforce) return; // can't disable if not pro
    const next = !enforce;
    setEnforce(next);
    startTransition(() => saveXSettings(next));
  }

  return (
    <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2">
        <XLogo size={18} />
        <h2 className="text-sm font-semibold text-[#f0ede8]">X settings</h2>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-[#f0ede8]">Enforce 280-character limit</p>
            <p className="text-xs text-[#666] mt-1">
              {isPro
                ? "Turn off if you have an X Premium subscription — Premium unlocks longer posts."
                : "X Premium subscribers can disable this limit. Upgrade your X account to unlock."}
            </p>
            {!isPro && (
              <p className="text-[11px] text-[#d4ff00]/70 mt-1.5 font-medium">
                Requires X Premium subscription to disable
              </p>
            )}
          </div>

          <button
            onClick={toggle}
            disabled={pending || (!isPro && !enforce)}
            aria-label="Toggle 280 character limit"
            className={`
              relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200
              ${enforce ? "bg-[#d4ff00]" : "bg-white/[0.1]"}
              ${!isPro && enforce ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              ${pending ? "opacity-60" : ""}
              focus:outline-none focus:ring-2 focus:ring-[#d4ff00]/40
            `}
          >
            <span
              className={`
                absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm
                transition-transform duration-200
                ${enforce ? "translate-x-5" : "translate-x-0"}
              `}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
