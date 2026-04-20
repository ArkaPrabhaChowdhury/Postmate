"use client";

import { useState, useTransition } from "react";
import { Pencil, RefreshCw, Check, X } from "lucide-react";
import { updateNewsTweet, regenerateNewsTweet } from "./actions";

function XLogo({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1200 1227" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
    </svg>
  );
}

type Props = {
  id: string;
  articleUrl: string;
  articleTitle: string;
  tweet: string;
};

export function TweetCard({ id, articleUrl, articleTitle, tweet: initialTweet }: Props) {
  const [tweet, setTweet] = useState(initialTweet);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialTweet);
  const [regenPrompt, setRegenPrompt] = useState("");
  const [isPending, startTransition] = useTransition();

  function startEdit() {
    setDraft(tweet);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setRegenPrompt("");
  }

  function saveEdit() {
    startTransition(async () => {
      await updateNewsTweet(id, draft);
      setTweet(draft);
      setEditing(false);
    });
  }

  function regenerate() {
    startTransition(async () => {
      const updated = await regenerateNewsTweet(id, regenPrompt || undefined);
      setTweet(updated);
      setDraft(updated);
      setEditing(false);
      setRegenPrompt("");
    });
  }

  let hostname = "";
  try { hostname = new URL(articleUrl).hostname.replace("www.", ""); } catch {}

  return (
    <div className="border border-white/[0.08] rounded-xl bg-[#0c0c0c] overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <a
          href={articleUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-[#888] hover:text-[#d4ff00] transition-colors leading-snug line-clamp-1"
        >
          {articleTitle}
        </a>
      </div>

      <div className="px-4 pb-3">
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className="w-full bg-[#090909] border border-white/[0.12] rounded-lg px-3 py-2.5 text-sm text-[#e0ddd8] outline-none focus:border-[#d4ff00]/50 transition-colors resize-none"
          />
        ) : (
          <p className="text-sm text-[#e0ddd8] leading-relaxed whitespace-pre-wrap">{tweet}</p>
        )}
      </div>

      {editing && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          <input
            value={regenPrompt}
            onChange={(e) => setRegenPrompt(e.target.value)}
            placeholder="Additional instruction for AI (optional)… e.g. 'make it more concise' or 'add a hot take angle'"
            className="w-full bg-[#090909] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-[#f0ede8] placeholder:text-[#444] outline-none focus:border-[#d4ff00]/50 transition-colors"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={regenerate}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#d4ff00]/10 hover:bg-[#d4ff00]/20 border border-[#d4ff00]/30 text-[#d4ff00] text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={11} className={isPending ? "animate-spin" : ""} />
              {isPending ? "Regenerating…" : "Regenerate with AI"}
            </button>
            <button
              onClick={saveEdit}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-[#f0ede8] text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <Check size={11} />
              Save edit
            </button>
            <button
              onClick={cancelEdit}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[#555] hover:text-[#888] text-xs transition-colors"
            >
              <X size={11} />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="px-4 pb-4 flex items-center justify-between gap-3">
        <a
          href={articleUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-mono text-[#444] hover:text-[#666] transition-colors truncate"
        >
          {hostname}
        </a>
        <div className="flex items-center gap-2 shrink-0">
          {!editing && (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#888] rounded-lg transition-colors"
            >
              <Pencil size={10} />
              Edit
            </button>
          )}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold bg-black text-white border border-white/[0.12] rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <XLogo size={11} />
            Post to X
          </a>
        </div>
      </div>
    </div>
  );
}
