"use client";

import { useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";

export default function BillingSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || "Failed to open billing portal.");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  return (
    <section className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2">
        <CreditCard size={14} className="text-[#888]" />
        <h2 className="text-sm font-semibold text-[#f0ede8]">Billing</h2>
      </div>
      <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-[#666]">Manage your plan, payment method, invoices, and cancel anytime.</p>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
        <button
          type="button"
          onClick={openPortal}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-[#f0ede8] rounded-lg transition-colors disabled:opacity-60"
        >
          <ExternalLink size={13} />
          {loading ? "Opening…" : "Manage billing"}
        </button>
      </div>
    </section>
  );
}

