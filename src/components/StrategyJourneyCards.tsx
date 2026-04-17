"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Linkedin, Check, MessageCircle, Repeat2, Heart, BarChart2,
         Bookmark, Share, MoreHorizontal, BadgeCheck, ArrowRight, X as XIcon } from "lucide-react";
import { XLogo } from "@/components/XLogo";

export type JourneyPostData = {
    title: string;
    stage: string;
    emoji: string;
    content: string;
};

const stageStyles: Record<string, { dot: string; badge: string; border: string }> = {
    origin:     { dot: "bg-[#d4ff00]",  badge: "bg-[#d4ff00]/10 text-[#d4ff00] border-[#d4ff00]/20",      border: "border-[#d4ff00]/20" },
    build:      { dot: "bg-blue-500",   badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",           border: "border-blue-500/20" },
    launch:     { dot: "bg-emerald-500",badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",  border: "border-emerald-500/20" },
    milestone:  { dot: "bg-sky-500",    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",              border: "border-sky-500/20" },
    challenge:  { dot: "bg-amber-500",  badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",        border: "border-amber-500/20" },
    growth:     { dot: "bg-teal-500",   badge: "bg-teal-500/10 text-teal-400 border-teal-500/20",           border: "border-teal-500/20" },
    reflection: { dot: "bg-[#555]",     badge: "bg-white/[0.06] text-[#888] border-white/[0.1]",           border: "border-white/[0.1]" },
};

const MAX_X = 280;

function getStyle(stage: string) {
    return stageStyles[stage] ?? stageStyles.reflection;
}

// ─── Thread Poster ────────────────────────────────────────────────────────────

function ThreadPoster({ posts, onExit }: { posts: JourneyPostData[]; onExit: () => void }) {
    const [step, setStep] = useState(0);
    const [contents, setContents] = useState(() => posts.map(p => p.content));
    const [waitingForReturn, setWaitingForReturn] = useState(false);
    const [completed, setCompleted] = useState<Set<number>>(new Set());
    const openedAtRef = useRef(0);

    const total = posts.length;
    const isLast = step === total - 1;
    const allDone = completed.size === total;
    const current = contents[step];
    const charCount = current.length;
    const over = charCount > MAX_X;
    const s = getStyle(posts[step].stage);

    // Auto-advance when user tabs back from X
    useEffect(() => {
        function onFocus() {
            if (!waitingForReturn) return;
            if (Date.now() - openedAtRef.current < 1500) return;
            markCurrentDone();
        }
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [waitingForReturn, step, isLast]);

    function markCurrentDone() {
        setCompleted(prev => new Set([...prev, step]));
        setWaitingForReturn(false);
        if (!isLast) setStep(s => s + 1);
    }

    function handlePost() {
        navigator.clipboard.writeText(current).catch(() => {});
        // Tweet 1 and fits in 280: pre-fill the composer
        const url = (step === 0 && !over)
            ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(current)}`
            : "https://twitter.com/compose/tweet";
        window.open(url, "_blank", "noopener,noreferrer");
        openedAtRef.current = Date.now();
        setWaitingForReturn(true);
    }

    // ── All done ──
    if (allDone) {
        return (
            <div className="flex flex-col items-center justify-center gap-5 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Check size={20} className="text-emerald-400" />
                </div>
                <div>
                    <p className="text-[#f0ede8] font-semibold text-base">Thread posted</p>
                    <p className="text-[#555] text-xs mt-1">{total} tweets live on X</p>
                </div>
                <button
                    type="button"
                    onClick={onExit}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-[#888] rounded-lg transition-colors"
                >
                    Back to posts
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#555]">
                        Post thread
                    </span>
                    {/* Step dots */}
                    <div className="flex items-center gap-1.5">
                        {posts.map((_, i) => (
                            <div
                                key={i}
                                className={`rounded-full transition-all duration-200 ${
                                    completed.has(i)
                                        ? "w-2 h-2 bg-emerald-500"
                                        : i === step
                                        ? "w-3 h-2 bg-[#d4ff00]"
                                        : "w-2 h-2 bg-white/[0.1]"
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-[11px] text-[#555] font-mono">
                        {step + 1}/{total}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onExit}
                    className="p-1.5 rounded-lg text-[#555] hover:text-[#888] hover:bg-white/[0.05] transition-colors"
                >
                    <XIcon size={14} />
                </button>
            </div>

            {/* Completed steps */}
            {completed.size > 0 && (
                <div className="flex flex-col gap-1.5">
                    {[...completed].sort((a, b) => a - b).map(i => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <Check size={11} className="text-emerald-400 flex-shrink-0" />
                            <span className={`inline-flex items-center px-1.5 py-0 rounded border text-[9px] font-bold tracking-widest uppercase ${getStyle(posts[i].stage).badge}`}>
                                {posts[i].stage}
                            </span>
                            <span className="text-xs text-[#666] truncate">{posts[i].title}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Current tweet card */}
            <div className={`rounded-xl border bg-[#0c0c0c] overflow-hidden ${s.border}`}>
                {/* Card header */}
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold tracking-widest uppercase ${s.badge}`}>
                        {posts[step].stage}
                    </span>
                    <span className="text-sm font-semibold text-[#f0ede8]">{posts[step].title}</span>
                </div>

                {/* Instruction for replies */}
                {step > 0 && (
                    <div className="px-4 pt-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#d4ff00] flex-shrink-0" />
                        <p className="text-[11px] text-[#d4ff00]/70">
                            Reply to your previous tweet to continue the thread
                        </p>
                    </div>
                )}

                {/* Editable textarea */}
                <div className="p-4">
                    <textarea
                        value={current}
                        onChange={e => {
                            const updated = [...contents];
                            updated[step] = e.target.value;
                            setContents(updated);
                        }}
                        rows={6}
                        className={`w-full resize-y bg-[#090909] border rounded-xl p-3 text-sm text-[#f0ede8] leading-relaxed outline-none transition-colors placeholder:text-[#444] font-sans ${
                            over
                                ? "border-red-500/50 focus:border-red-500"
                                : "border-white/[0.08] focus:border-[#d4ff00]/50"
                        }`}
                    />

                    {/* Char counter */}
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                            {over ? (
                                <span className="text-xs text-red-400 font-mono">
                                    {charCount - MAX_X} over limit — trim before posting
                                </span>
                            ) : (
                                <span className="text-xs text-[#555] font-mono">
                                    {MAX_X - charCount} chars remaining
                                </span>
                            )}
                        </div>
                        <span className={`text-xs font-mono font-bold ${over ? "text-red-400" : charCount > 240 ? "text-amber-400" : "text-[#555]"}`}>
                            {charCount}/{MAX_X}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
                    {waitingForReturn ? (
                        <>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#090909] border border-white/[0.06] text-xs text-[#555]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff00] animate-pulse flex-shrink-0" />
                                Waiting for you to return…
                            </div>
                            <button
                                type="button"
                                onClick={markCurrentDone}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-[#666] rounded-lg transition-colors"
                            >
                                <Check size={11} />
                                {isLast ? "Done" : "Posted — next tweet →"}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={handlePost}
                            disabled={over}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-black hover:bg-white/[0.06] text-white border border-white/[0.15] hover:border-white/[0.25] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <XLogo size={13} />
                            {step === 0 ? "Copy & Tweet" : "Copy & Open X"}
                            <ArrowRight size={12} className="text-[#555]" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Post Card (normal view) ──────────────────────────────────────────────────

function PostCard({ post, index, total }: { post: JourneyPostData; index: number; total: number }) {
    const [copied, setCopied] = useState(false);
    const [copiedX, setCopiedX] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [, startTransition] = useTransition();
    const s = getStyle(post.stage);
    const isLast = index === total - 1;
    const preview = post.content.length > 240 ? post.content.slice(0, 240) + "…" : post.content;

    function handlePost() {
        navigator.clipboard.writeText(post.content).catch(() => {});
        setCopied(true);
        startTransition(() => {});
        setTimeout(() => window.open("https://www.linkedin.com/feed/", "_blank", "noopener"), 300);
        setTimeout(() => setCopied(false), 3500);
    }

    function handlePostX() {
        const text = encodeURIComponent(post.content);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener");
        setCopiedX(true);
        setTimeout(() => setCopiedX(false), 3500);
    }

    return (
        <div className="flex gap-4">
            {/* Timeline */}
            <div className="flex flex-col items-center pt-1">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-[#090909] ${s.dot}`} />
                {!isLast && <div className="w-px flex-1 mt-1.5 bg-white/[0.08]" />}
            </div>

            {/* Card */}
            <div className={`flex-1 mb-6 bg-[#0c0c0c] border rounded-xl overflow-hidden ${s.border}`}>
                {/* Card header */}
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold tracking-widest uppercase ${s.badge}`}>
                            {post.stage}
                        </span>
                        <span className="text-sm font-semibold text-[#f0ede8]">{post.title}</span>
                    </div>
                    <span className="text-[11px] text-[#555] font-mono flex-shrink-0">
                        {index + 1}/{total}
                    </span>
                </div>

                {/* X thread mock */}
                <div className="p-4 bg-black rounded-none border-b border-white/[0.08]">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/[0.1] flex-shrink-0" />
                            <div className="flex items-center flex-wrap gap-x-1">
                                <span className="text-[15px] font-bold text-[#f0ede8] hover:underline cursor-pointer">Your Name</span>
                                <BadgeCheck size={16} className="text-[#1d9bf0] fill-white" />
                                <span className="text-[15px] text-[#666]">@yourhandle</span>
                                <span className="text-[15px] text-[#666]">·</span>
                                <span className="text-[15px] text-[#666] hover:underline cursor-pointer">3h</span>
                            </div>
                        </div>
                        <div className="text-[#666] hover:text-[#aaa] cursor-pointer p-1">
                            <MoreHorizontal size={18} />
                        </div>
                    </div>

                    <div className="text-[15px] text-[#f0ede8] leading-normal whitespace-pre-wrap mb-3">
                        {(expanded ? post.content : preview)
                            .split(/(#[a-zA-Z]\w*)/)
                            .map((part, i) =>
                                part.startsWith("#") ? (
                                    <span key={i} className="text-[#1d9bf0] hover:underline cursor-pointer">{part}</span>
                                ) : part
                            )}
                    </div>

                    {post.content.length > 240 && (
                        <button
                            type="button"
                            onClick={() => setExpanded(v => !v)}
                            className="text-[15px] text-[#1d9bf0] hover:underline mb-3"
                        >
                            {expanded ? "Show less" : "Show more"}
                        </button>
                    )}

                    {/* Reactions */}
                    <div className="flex items-center justify-between text-[#555] mt-2">
                        <div className="flex items-center gap-1 group cursor-pointer hover:text-[#1d9bf0] transition-colors -ml-2">
                            <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors"><MessageCircle size={18} /></div>
                            <span className="text-[13px]">62</span>
                        </div>
                        <div className="flex items-center gap-1 group cursor-pointer hover:text-[#00ba7c] transition-colors">
                            <div className="p-2 rounded-full group-hover:bg-[#00ba7c]/10 transition-colors"><Repeat2 size={18} /></div>
                            <span className="text-[13px]">12</span>
                        </div>
                        <div className="flex items-center gap-1 group cursor-pointer hover:text-[#f91880] transition-colors">
                            <div className="p-2 rounded-full group-hover:bg-[#f91880]/10 transition-colors"><Heart size={18} /></div>
                            <span className="text-[13px]">30</span>
                        </div>
                        <div className="flex items-center gap-1 group cursor-pointer hover:text-[#1d9bf0] transition-colors">
                            <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors"><BarChart2 size={18} /></div>
                            <span className="text-[13px]">1.1K</span>
                        </div>
                        <div className="flex items-center gap-0 group cursor-pointer hover:text-[#1d9bf0] transition-colors">
                            <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors"><Bookmark size={18} /></div>
                            <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors"><Share size={18} /></div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[#555]">
                        {post.content.length.toLocaleString()} chars
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePost}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ${
                                copied ? "bg-emerald-500 text-white" : "bg-[#0A66C2] hover:bg-[#004182] text-white"
                            }`}
                        >
                            {copied ? <><Check size={11} /> Copied</> : <><Linkedin size={12} /> LinkedIn</>}
                        </button>
                        <button
                            type="button"
                            onClick={handlePostX}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ${
                                copiedX ? "bg-emerald-500 text-white" : "bg-black hover:bg-white/[0.06] text-white border border-white/[0.12] hover:border-white/[0.2]"
                            }`}
                        >
                            {copiedX ? <><Check size={11} /> Opening X…</> : <><XLogo size={12} /> Post to X</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── StrategyJourneyCards (root export) ──────────────────────────────────────

export function StrategyJourneyCards({ posts }: { posts: JourneyPostData[] }) {
    const [threadMode, setThreadMode] = useState(false);

    if (!posts.length) return null;

    return (
        <div>
            {/* Header row */}
            <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#555]">
                    {posts.length}-post journey
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            {/* Thread mode toggle */}
            {!threadMode && (
                <div className="flex justify-end mb-4">
                    <button
                        type="button"
                        onClick={() => setThreadMode(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-black hover:bg-white/[0.06] text-white border border-white/[0.12] hover:border-white/[0.2] rounded-lg transition-colors"
                    >
                        <XLogo size={12} />
                        Post as thread
                    </button>
                </div>
            )}

            {threadMode ? (
                <ThreadPoster posts={posts} onExit={() => setThreadMode(false)} />
            ) : (
                <div>
                    {posts.map((post, i) => (
                        <PostCard key={i} post={post} index={i} total={posts.length} />
                    ))}
                </div>
            )}
        </div>
    );
}
