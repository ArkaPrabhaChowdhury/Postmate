"use client";

import { useState, useTransition } from "react";
import { Linkedin, Twitter, Copy, Check, AlertCircle, ThumbsUp, MessageSquare, Repeat2, Send } from "lucide-react";

const MAX = 3000;

function CharRing({ count }: { count: number }) {
  const remaining = MAX - count;
  const pct = Math.min(count / MAX, 1);
  const r = 16;
  const circ = 2 * Math.PI * r;
  const over = remaining < 0;
  const warn = remaining < 300;
  const color = over ? "#ef4444" : warn ? "#f59e0b" : "#6366f1";

  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#27272a" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.2s, stroke 0.2s" }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
        style={{ color }}
      >
        {over ? `-${Math.abs(remaining)}` : remaining <= 99 ? remaining : ""}
      </div>
    </div>
  );
}

export function PostEditor(props: {
  postId: string;
  initialContent: string;
  onSave: (fd: FormData) => Promise<void>;
  onMarkCopied: (id: string) => Promise<void>;
  onFindImage?: (fd: FormData) => Promise<string>;
  repoFullName?: string;
}) {
  const [content, setContent] = useState(props.initialContent);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedX, setCopiedX] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string>("");
  const [manualSiteUrl, setManualSiteUrl] = useState("");
  const [, startTransition] = useTransition();

  const over = content.length > MAX;
  const hashtags = [...new Set(content.match(/#[a-zA-Z]\w*/g) ?? [])];

  async function handleSave(fd: FormData) {
    fd.set("id", props.postId);
    fd.set("content", content);
    await props.onSave(fd);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handlePost() {
    navigator.clipboard.writeText(content).catch(() => { });
    startTransition(() => props.onMarkCopied(props.postId));
    setCopied(true);
    setTimeout(() => window.open("https://www.linkedin.com/feed/?shareActive=true", "_blank", "noopener"), 300);
    setTimeout(() => setCopied(false), 3500);
  }

  function handlePostX() {
    const text = encodeURIComponent(content);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener");
    setCopiedX(true);
    setTimeout(() => setCopiedX(false), 3500);
  }

  async function handleFindImage() {
    if (!props.onFindImage || !props.repoFullName) {
      setImageError("No repo available for image lookup.");
      return;
    }
    setImageError("");
    setImageLoading(true);
    try {
      const fd = new FormData();
      fd.set("repoFullName", props.repoFullName);
      fd.set("postId", props.postId);
      if (manualSiteUrl) fd.set("siteUrl", manualSiteUrl);
      const url = await props.onFindImage(fd);
      if (!url) {
        setImageError("No image found in README or site URL.");
      } else {
        setImageUrl(url);
      }
    } catch {
      setImageError("Failed to find an image.");
    } finally {
      setImageLoading(false);
    }
  }

  const lines = content.split("\n");

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* ── Editor ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">Editor</h3>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono ${over ? "text-red-400" : "text-zinc-500"}`}>
              {content.length.toLocaleString()} / {MAX.toLocaleString()}
            </span>
            <CharRing count={content.length} />
          </div>
        </div>

        <form action={handleSave} className="flex flex-col gap-3">
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setSaved(false); }}
            className={`
              w-full h-80 resize-y bg-zinc-950 border rounded-xl p-4
              text-sm text-zinc-100 leading-relaxed font-sans
              outline-none transition-colors placeholder:text-zinc-600
              ${over
                ? "border-red-500/60 focus:border-red-500"
                : "border-zinc-800 focus:border-indigo-500/60"
              }
            `}
            placeholder="Your LinkedIn post…"
          />

          {over && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertCircle size={12} />
              Post exceeds LinkedIn&apos;s 3,000-character limit
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="submit"
              disabled={over}
              className={`
                inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors
                ${saved
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200"
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {saved ? <><Check size={12} /> Saved</> : "Save draft"}
            </button>

            <button
              type="button"
              onClick={handlePost}
              disabled={over}
              className={`
                inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors
                ${copied
                  ? "bg-emerald-500 text-white"
                  : "bg-[#0A66C2] hover:bg-[#004182] text-white"
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {copied
                ? <><Check size={12} /> Copied — LinkedIn opening…</>
                : <><Linkedin size={13} /> Post to LinkedIn</>
              }
            </button>

            <button
              type="button"
              onClick={handlePostX}
              disabled={over}
              className={`
                inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors
                ${copiedX
                  ? "bg-emerald-500 text-white"
                  : "bg-black hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500"
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {copiedX
                ? <><Check size={12} /> Opening X…</>
                : <><Twitter size={13} /> Post to X</>
              }
            </button>
          </div>
        </form>

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Hashtags detected
            </p>
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[11px] font-semibold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Image helper */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-zinc-100">Post image</p>
              <p className="text-xs text-zinc-500">Find README image or screenshot the site home.</p>
            </div>
            <button
              type="button"
              onClick={handleFindImage}
              disabled={imageLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg transition-colors disabled:opacity-60"
            >
              {imageLoading ? "Finding..." : "Find image"}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap py-4">
            <input
              type="url"
              value={manualSiteUrl}
              onChange={(e) => setManualSiteUrl(e.target.value)}
              placeholder="Enter site URL to screenshot (optional)"
              className="flex-1 min-w-56 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500/60"
            />
            <button
              type="button"
              onClick={handleFindImage}
              disabled={imageLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg transition-colors disabled:opacity-60"
            >
              {manualSiteUrl ? "Use URL" : "Search"}
            </button>
          </div>

          {imageError && (
            <p className="text-xs text-red-400">{imageError}</p>
          )}

          {imageUrl && (
            <div className="flex flex-col gap-2">
              <img
                src={imageUrl}
                alt="Post image"
                className="rounded-lg border border-zinc-800 max-h-80 w-full object-cover"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(imageUrl)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg transition-colors"
                >
                  Copy image URL
                </button>
                <a
                  href={imageUrl}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg transition-colors"
                >
                  Download image
                </a>
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  Open image
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── LinkedIn Preview ── */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-zinc-100">LinkedIn preview</h3>

        <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-sm font-sans">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
              Y
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-100 leading-tight">You</p>
              <p className="text-xs text-zinc-500 leading-tight mt-0.5">Your headline · 1st</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Just now · 🌐</p>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 pb-3 overflow-y-auto max-h-64 text-sm text-zinc-300 leading-relaxed">
            {lines.map((line, i) => (
              <p key={i} className="mb-0.5 whitespace-pre-wrap">
                {line.split(/(#[a-zA-Z]\w*)/).map((part, j) =>
                  part.startsWith("#") ? (
                    <span key={j} className="text-indigo-400 font-semibold">{part}</span>
                  ) : part
                )}
              </p>
            ))}
          </div>

          {/* Reactions */}
          <div className="border-t border-zinc-800 px-2 py-1 flex">
            {[
              { icon: ThumbsUp, label: "Like" },
              { icon: MessageSquare, label: "Comment" },
              { icon: Repeat2, label: "Repost" },
              { icon: Send, label: "Send" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                className="flex-1 flex flex-col items-center gap-1.5 py-1.5 text-[10px] font-semibold text-zinc-500 rounded-md hover:bg-zinc-800 hover:text-zinc-300 cursor-default"
              >
                <Icon size={14} className="mt-0.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Copy tip */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
          <Copy size={13} className="text-zinc-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            <strong className="text-zinc-300">Tip:</strong> Click "Post to LinkedIn" to copy the text, then paste it when the LinkedIn tab opens. The LinkedIn API doesn&apos;t allow 3rd-party posting, so this is the fastest flow.
          </p>
        </div>
      </div>
    </div>
  );
}
