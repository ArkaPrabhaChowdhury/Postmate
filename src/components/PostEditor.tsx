"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Linkedin, Copy, Check, AlertCircle, ThumbsUp, MessageSquare, Repeat2, Send, Heart, BarChart2, Bookmark, Upload, Sparkles, RefreshCw, Download, Calendar, X as XIcon } from "lucide-react";
import { XLogo } from "@/components/XLogo";
import { LinkedInSchedulePicker } from "@/components/LinkedInSchedulePicker";

type PostScore = { hook: number; clarity: number; cta: number; tips: string[] };

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 8 ? "#d4ff00" : value >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-[#666] w-12 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value * 10}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-bold w-5 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

function ScoreCard({ score, loading }: { score: PostScore | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        <Sparkles size={12} className="text-[#d4ff00] animate-pulse" />
        <span className="text-[11px] text-[#555]">Scoring…</span>
      </div>
    );
  }
  if (!score) return null;
  const avg = Math.round((score.hook + score.clarity + score.cta) / 3);
  return (
    <div className="rounded-xl bg-[#0c0c0c] border border-white/[0.08] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-[#d4ff00]" />
          <span className="text-xs font-semibold text-[#f0ede8]">Quality Score</span>
        </div>
        <span className="text-lg font-bold text-[#d4ff00]">{avg}<span className="text-xs text-[#555] font-normal">/10</span></span>
      </div>
      <div className="flex flex-col gap-2">
        <ScoreBar label="Hook" value={score.hook} />
        <ScoreBar label="Clarity" value={score.clarity} />
        <ScoreBar label="CTA" value={score.cta} />
      </div>
      {score.tips.length > 0 && (
        <div className="flex flex-col gap-1 pt-1 border-t border-white/[0.06]">
          {score.tips.map((tip, i) => (
            <p key={i} className="text-[11px] text-[#888] leading-snug">· {tip}</p>
          ))}
        </div>
      )}
      <p className="text-[11px] text-[#555] leading-snug pt-1 border-t border-white/[0.04]">
        💡 Tip: posts with an image or screenshot typically get 2× more reach — use "Post image" below if you have one.
      </p>
    </div>
  );
}

const LIMITS = { linkedin: 3000, x: 280 } as const;
type Platform = "linkedin" | "x";

function CharRing({ count, max }: { count: number; max: number }) {
  const remaining = max - count;
  const pct = Math.min(count / max, 1);
  const r = 16;
  const circ = 2 * Math.PI * r;
  const over = remaining < 0;
  const warn = remaining < 300;
  const color = over ? "#ef4444" : warn ? "#f59e0b" : "#d4ff00";

  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
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
  initialLinkedinStatus?: string;
  initialScheduledAt?: string | null;
  linkedinConnected?: boolean;
  onSave: (fd: FormData) => Promise<void>;
  onMarkCopied: (id: string) => Promise<void>;
  onPostLinkedIn?: (postId: string) => Promise<{ ok: boolean; error?: string }>;
  onScheduleLinkedIn?: (postId: string, scheduledAt: string) => Promise<{ ok: boolean; error?: string }>;
  onCancelSchedule?: (postId: string) => Promise<void>;
  onFindImage?: (fd: FormData) => Promise<string>;
  onScore?: (content: string) => Promise<PostScore>;
  onRegenerate?: (postId: string, prompt: string) => Promise<string>;
  repoFullName?: string;
}) {
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const MAX = LIMITS[platform];
  const minSchedule = useMemo(() => new Date(Date.now() + 60000), []);
  const [content, setContent] = useState(props.initialContent);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedX, setCopiedX] = useState(false);
  const [linkedinStatus, setLinkedinStatus] = useState(props.initialLinkedinStatus ?? "none");
  const [linkedinError, setLinkedinError] = useState("");
  const [linkedinPosting, setLinkedinPosting] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [scheduledAt, setScheduledAt] = useState(props.initialScheduledAt ?? null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string>("");
  const [manualSiteUrl, setManualSiteUrl] = useState("");
  const [score, setScore] = useState<PostScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState("");
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

  async function handlePost() {
    if (props.onPostLinkedIn && props.linkedinConnected) {
      setLinkedinError("");
      setLinkedinPosting(true);
      try {
        const result = await props.onPostLinkedIn(props.postId);
        if (result.ok) {
          setLinkedinStatus("posted");
          setCopied(true);
          setTimeout(() => setCopied(false), 3500);
        } else {
          setLinkedinError(result.error ?? "Post failed.");
        }
      } finally {
        setLinkedinPosting(false);
      }
    } else {
      navigator.clipboard.writeText(content).catch(() => { });
      startTransition(() => props.onMarkCopied(props.postId));
      setCopied(true);
      setTimeout(() => window.open("https://www.linkedin.com/feed/?shareActive=true", "_blank", "noopener"), 300);
      setTimeout(() => setCopied(false), 3500);
    }
  }

  async function handleScheduleLinkedIn() {
    if (!props.onScheduleLinkedIn || !scheduleDateTime) return;
    setLinkedinError("");
    const result = await props.onScheduleLinkedIn(props.postId, scheduleDateTime);
    if (result.ok) {
      setLinkedinStatus("scheduled");
      setScheduledAt(scheduleDateTime);
      setShowScheduler(false);
      setScheduleDateTime("");
    } else {
      setLinkedinError(result.error ?? "Failed to schedule.");
    }
  }

  async function handleCancelSchedule() {
    if (!props.onCancelSchedule) return;
    await props.onCancelSchedule(props.postId);
    setLinkedinStatus("none");
    setScheduledAt(null);
  }

  async function handlePostX() {
    const text = encodeURIComponent(content);
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank", "noopener");
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

  async function handleScore() {
    if (!props.onScore) return;
    setScoreLoading(true);
    try {
      const result = await props.onScore(content);
      setScore(result);
    } finally {
      setScoreLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!props.onRegenerate) return;
    setRegenError("");
    setRegenLoading(true);
    try {
      const updated = await props.onRegenerate(props.postId, regenPrompt);
      setContent(updated);
      setScore(null);
      setRegenPrompt("");
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : "Regeneration failed.");
    } finally {
      setRegenLoading(false);
    }
  }

  async function handleDownloadImage() {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Extract filename or use default
      const filename = imageUrl.split("/").pop()?.split("?")[0] || "image.png";
      a.download = filename.includes(".") ? filename : `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed", err);
      // Fallback: open in new tab
      window.open(imageUrl, "_blank", "noopener,noreferrer");
    }
  }

  const lines = content.split("\n");

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* ── Editor ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#f0ede8]">Editor</h3>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono ${over ? "text-red-400" : "text-[#666]"}`}>
              {content.length.toLocaleString()} / {MAX.toLocaleString()}
            </span>
            <CharRing count={content.length} max={MAX} />
          </div>
        </div>

        <form action={handleSave} className="flex flex-col gap-3">
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setSaved(false); }}
            className={`
              w-full h-80 resize-y bg-[#090909] border rounded-xl p-4
              text-sm text-[#f0ede8] leading-relaxed font-sans
              outline-none transition-colors placeholder:text-[#444]
              ${over
                ? "border-red-500/60 focus:border-red-500"
                : "border-white/[0.08] focus:border-[#d4ff00]/50"
              }
            `}
            placeholder="Your LinkedIn post…"
          />

          {over && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertCircle size={12} />
              {platform === "x"
                ? "Post exceeds X's 280-character limit"
                : "Post exceeds LinkedIn's 3,000-character limit"}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {props.onScore && (
              <button
                type="button"
                onClick={handleScore}
                disabled={scoreLoading || content.trim().length < 20}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors bg-[#d4ff00]/10 hover:bg-[#d4ff00]/20 border border-[#d4ff00]/20 text-[#d4ff00] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles size={12} />
                {scoreLoading ? "Scoring…" : "Score post"}
              </button>
            )}
            <button
              type="submit"
              disabled={over}
              className={`
                inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors
                ${saved
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-[#aaa]"
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {saved ? <><Check size={12} /> Saved</> : "Save draft"}
            </button>

            {linkedinStatus === "scheduled" && scheduledAt ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Calendar size={12} />
                  <span suppressHydrationWarning>
                    Scheduled {isMounted ? new Date(scheduledAt).toLocaleString(undefined, { hour12: true }) : ""}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleCancelSchedule}
                  className="inline-flex items-center gap-1 px-2 py-2 text-xs text-[#666] hover:text-red-400 transition-colors"
                >
                  <XIcon size={11} /> Cancel
                </button>
              </div>
            ) : linkedinStatus === "posted" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Check size={12} /> Posted to LinkedIn
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={over || linkedinPosting}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors
                    ${copied
                      ? "bg-emerald-500 text-white"
                      : "bg-[#0A66C2] hover:bg-[#004182] text-white"
                    }
                    disabled:opacity-40 disabled:cursor-not-allowed
                  `}
                >
                  {linkedinPosting
                    ? <><Sparkles size={12} className="animate-pulse" /> Posting…</>
                    : copied
                    ? <><Check size={12} /> {props.linkedinConnected ? "Posted!" : "Copied — LinkedIn opening…"}</>
                    : <><Linkedin size={13} /> {props.linkedinConnected ? "Post to LinkedIn" : "Copy & Open LinkedIn"}</>
                  }
                </button>
                {props.linkedinConnected && props.onScheduleLinkedIn && (
                  <button
                    type="button"
                    onClick={() => setShowScheduler(!showScheduler)}
                    disabled={over}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-[#aaa] disabled:opacity-40"
                  >
                    <Calendar size={12} /> Schedule
                  </button>
                )}
              </>
            )}
            {showScheduler && (
              <div className="flex items-center gap-2 w-full mt-1">
                <div className="flex-1">
                  <LinkedInSchedulePicker
                    value={scheduleDateTime}
                    onChange={setScheduleDateTime}
                    min={minSchedule}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleScheduleLinkedIn}
                  disabled={!scheduleDateTime}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg transition-colors disabled:opacity-40"
                >
                  Confirm
                </button>
                <button type="button" onClick={() => setShowScheduler(false)} className="text-[#666] hover:text-[#aaa] transition-colors">
                  <XIcon size={13} />
                </button>
              </div>
            )}
            {linkedinError && <p className="text-xs text-red-400 w-full mt-1">{linkedinError}</p>}

            <button
              type="button"
              onClick={handlePostX}
              disabled={over}
              className={`
                inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors
                ${copiedX
                  ? "bg-emerald-500 text-white"
                  : "bg-black hover:bg-white/[0.06] text-white border border-white/[0.12] hover:border-white/[0.2]"
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {copiedX
                ? <><Check size={12} /> Opening X…</>
                : <><XLogo size={13} /> Post to X</>
              }
            </button>
          </div>
        </form>

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-[#555] uppercase tracking-wider mb-2">
              Hashtags detected
            </p>
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 bg-[#d4ff00]/10 text-[#d4ff00] border border-[#d4ff00]/20 rounded-full text-[11px] font-semibold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Score card */}
        <ScoreCard score={score} loading={scoreLoading} />

        {/* Regenerate with AI */}
        {props.onRegenerate && (
          <div className="rounded-xl bg-[#0c0c0c] border border-white/[0.08] p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <RefreshCw size={12} className="text-[#d4ff00]" />
              <span className="text-xs font-semibold text-[#f0ede8]">Regenerate with AI</span>
            </div>
            <p className="text-[11px] text-[#555] leading-snug">
              Describe what to improve — reference the score feedback above or give your own direction.
            </p>
            <textarea
              value={regenPrompt}
              onChange={(e) => setRegenPrompt(e.target.value)}
              rows={3}
              placeholder={`e.g. "make the hook stronger", "cut to 200 words", "less jargon, more story", "add a specific metric from the diff"`}
              className="w-full bg-[#090909] border border-white/[0.1] rounded-lg px-3 py-2.5 text-xs text-[#f0ede8] placeholder:text-[#444] outline-none focus:border-[#d4ff00]/50 transition-colors resize-none"
            />
            {regenError && <p className="text-xs text-red-400">{regenError}</p>}
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenLoading}
              className="self-start inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#d4ff00]/10 hover:bg-[#d4ff00]/20 border border-[#d4ff00]/20 text-[#d4ff00] rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={11} className={regenLoading ? "animate-spin" : ""} />
              {regenLoading ? "Regenerating…" : "Regenerate"}
            </button>
          </div>
        )}

        {/* Image helper */}
        <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-[#f0ede8]">Post image</p>
              <p className="text-xs text-[#666]">Find README image or screenshot the site home.</p>
            </div>
            <button
              type="button"
              onClick={handleFindImage}
              disabled={imageLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-[#aaa] rounded-lg transition-colors disabled:opacity-60"
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
              className="flex-1 min-w-56 bg-[#090909] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#f0ede8] placeholder:text-[#444] outline-none focus:border-[#d4ff00]/50 transition-colors"
            />
            <button
              type="button"
              onClick={handleFindImage}
              disabled={imageLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-[#aaa] rounded-lg transition-colors disabled:opacity-60"
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
                className="rounded-lg border border-white/[0.08] max-h-80 w-full object-cover"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(imageUrl)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-[#aaa] rounded-lg transition-colors"
                >
                  Copy image URL
                </button>
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-[#aaa] rounded-lg transition-colors"
                >
                  <Download size={12} />
                  Download image
                </button>
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#d4ff00]/70 hover:text-[#d4ff00] transition-colors"
                >
                  Open image
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Preview ── */}
      <div className="flex flex-col gap-4">
        {/* Platform toggle */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#f0ede8]">Preview</h3>
          <div className="flex items-center gap-1 p-0.5 bg-white/[0.05] border border-white/[0.08] rounded-lg">
            {(["linkedin", "x"] as Platform[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  platform === p
                    ? "bg-[#d4ff00] text-[#090909]"
                    : "text-[#666] hover:text-[#aaa]"
                }`}
              >
                {p === "linkedin" ? <Linkedin size={11} /> : <XLogo size={11} />}
                {p === "linkedin" ? "LinkedIn" : "X"}
              </button>
            ))}
          </div>
        </div>

        {platform === "linkedin" ? (
          <div className="bg-[#0c0c0c] rounded-xl overflow-hidden border border-white/[0.08] shadow-sm font-sans">
            {/* LinkedIn Header */}
            <div className="px-4 pt-4 pb-2 flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                Y
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#f0ede8] leading-tight">You</p>
                <p className="text-xs text-[#666] leading-tight mt-0.5">Your headline · 1st</p>
                <p className="text-[11px] text-[#555] mt-0.5">Just now · 🌐</p>
              </div>
            </div>
            {/* LinkedIn Body */}
            <div className="px-4 pb-3 overflow-y-auto max-h-64 text-sm text-[#aaa] leading-relaxed">
              {lines.map((line, i) => (
                <p key={i} className="mb-0.5 whitespace-pre-wrap">
                  {line.split(/(#[a-zA-Z]\w*)/).map((part, j) =>
                    part.startsWith("#") ? (
                      <span key={j} className="text-[#0A66C2] font-semibold">{part}</span>
                    ) : part
                  )}
                </p>
              ))}
            </div>
            {/* LinkedIn Reactions */}
            <div className="border-t border-white/[0.06] px-2 py-1 flex">
              {[
                { icon: ThumbsUp, label: "Like" },
                { icon: MessageSquare, label: "Comment" },
                { icon: Repeat2, label: "Repost" },
                { icon: Send, label: "Send" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  className="flex-1 flex flex-col items-center gap-1.5 py-1.5 text-[10px] font-semibold text-[#555] rounded-md hover:bg-white/[0.04] hover:text-[#888] cursor-default"
                >
                  <Icon size={14} className="mt-0.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-black rounded-xl overflow-hidden border border-white/[0.1] shadow-sm font-sans">
            {/* X Header */}
            <div className="px-4 pt-4 pb-2 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/[0.12] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                Y
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-white leading-tight">You</p>
                  <p className="text-xs text-[#71767b] leading-tight">@yourhandle · just now</p>
                </div>
              </div>
            </div>
            {/* X Body */}
            <div className="px-4 pb-3 text-sm text-white leading-relaxed">
              {content.length <= 280 ? (
                <p className="whitespace-pre-wrap">{content || <span className="text-[#555]">Your X post…</span>}</p>
              ) : (
                <>
                  <p className="whitespace-pre-wrap">{content.slice(0, 280)}</p>
                  <p className="text-red-400 text-xs mt-1">+{content.length - 280} chars over limit</p>
                </>
              )}
            </div>
            {/* X Engagement */}
            <div className="border-t border-white/[0.06] px-4 py-2 flex items-center gap-5">
              {[
                { icon: MessageSquare, count: "0", label: "reply" },
                { icon: Repeat2, count: "0", label: "repost" },
                { icon: Heart, count: "0", label: "like" },
                { icon: BarChart2, count: "0", label: "view" },
              ].map(({ icon: Icon, count, label }) => (
                <button
                  key={label}
                  type="button"
                  className="flex items-center gap-1.5 text-[#71767b] hover:text-[#1d9bf0] cursor-default text-xs"
                >
                  <Icon size={14} />
                  <span>{count}</span>
                </button>
              ))}
              <div className="ml-auto flex items-center gap-3 text-[#71767b]">
                <Bookmark size={14} />
                <Upload size={14} />
              </div>
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#0c0c0c] border border-white/[0.08]">
          <Copy size={13} className="text-[#555] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#666] leading-relaxed">
            {platform === "linkedin" ? (
              props.linkedinConnected
                ? <><strong className="text-[#aaa]">Tip:</strong> LinkedIn connected — posts go live directly via API. Use &ldquo;Schedule&rdquo; to queue at a specific time.</>
                : <><strong className="text-[#aaa]">Tip:</strong> Connect LinkedIn in <a href="/settings" className="text-[#d4ff00]/70 hover:text-[#d4ff00]">Settings</a> to enable direct posting. For now, copy + open LinkedIn.</>
            ) : (
              <><strong className="text-[#aaa]">Tip:</strong> Click &ldquo;Post to X&rdquo; to pre-fill the tweet composer. Trim to 280 chars first if needed.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
