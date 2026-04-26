"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function SupportPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const inputClass =
    "w-full bg-[#090909] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-[#f0ede8] placeholder:text-[#444] outline-none focus:border-[#d4ff00]/50 transition-colors";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-8 py-12">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold tracking-tight text-[#f0ede8]"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Support
        </h1>
        <p className="text-sm text-[#666] mt-2">
          Having an issue or a question? Send a message and I'll get back to you.
        </p>
      </div>

      {status === "done" ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <CheckCircle2 size={40} className="text-[#d4ff00]" />
          <p className="text-base font-semibold text-[#f0ede8]">Message sent</p>
          <p className="text-sm text-[#666]">I'll reply to your email as soon as possible.</p>
          <button
            onClick={() => { setStatus("idle"); setForm({ name: "", email: "", subject: "", message: "" }); }}
            className="mt-2 text-xs text-[#555] hover:text-[#888] transition-colors underline underline-offset-2"
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#888]">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Your name"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#888]">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#888]">Subject</label>
            <input
              required
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="What's this about?"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#888]">Message</label>
            <textarea
              required
              rows={6}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Describe your issue or question..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {status === "error" && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              <AlertCircle size={14} />
              Failed to send. Please try again or email arkopra@gmail.com directly.
            </div>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#d4ff00] hover:bg-[#c4ef00] disabled:opacity-60 disabled:cursor-not-allowed text-[#090909] text-sm font-bold rounded-xl transition-colors"
          >
            {status === "sending" ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#090909]/30 border-t-[#090909] rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send size={14} />
                Send message
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
