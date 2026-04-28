"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
    ArrowRight,
    BadgeCheck,
    BarChart2,
    Bookmark,
    Check,
    Heart,
    MessageCircle,
    MoreHorizontal,
    Repeat2,
    Share,
    X as XIcon,
} from "lucide-react";
import { XLogo } from "@/components/XLogo";

export type JourneyPostData = {
    title: string;
    stage: string;
    emoji: string;
    content: string;
};

type JourneyPostLike = Partial<JourneyPostData> & {
    body?: unknown;
    text?: unknown;
};

const stageStyles: Record<string, { dot: string; badge: string; border: string }> = {
    origin: { dot: "bg-[#d4ff00]", badge: "bg-[#d4ff00]/10 text-[#d4ff00] border-[#d4ff00]/20", border: "border-[#d4ff00]/20" },
    build: { dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20", border: "border-blue-500/20" },
    launch: { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", border: "border-emerald-500/20" },
    milestone: { dot: "bg-sky-500", badge: "bg-sky-500/10 text-sky-400 border-sky-500/20", border: "border-sky-500/20" },
    challenge: { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20", border: "border-amber-500/20" },
    growth: { dot: "bg-teal-500", badge: "bg-teal-500/10 text-teal-400 border-teal-500/20", border: "border-teal-500/20" },
    reflection: { dot: "bg-[#555]", badge: "bg-white/[0.06] text-[#888] border-white/[0.1]", border: "border-white/[0.1]" },
};

const MAX_X = 270;

function getStyle(stage: string) {
    return stageStyles[stage] ?? stageStyles.reflection;
}

function getPostContent(post: JourneyPostLike) {
    if (typeof post.content === "string") return post.content;
    if (typeof post.body === "string") return post.body;
    if (typeof post.text === "string") return post.text;
    return "";
}

function ThreadPoster({ posts, onExit }: { posts: JourneyPostData[]; onExit: () => void }) {
    const [step, setStep] = useState(0);
    const [contents, setContents] = useState(() => posts.map((post) => getPostContent(post)));
    const [waitingForReturn, setWaitingForReturn] = useState(false);
    const [completed, setCompleted] = useState<Set<number>>(new Set());
    const openedAtRef = useRef(0);

    const total = posts.length;
    const isLast = step === total - 1;
    const allDone = completed.size === total;
    const current = contents[step] ?? "";
    const charCount = current.length;
    const over = charCount > MAX_X;
    const activePost = posts[step];
    const s = getStyle(activePost.stage);

    useEffect(() => {
        function onFocus() {
            if (!waitingForReturn) return;
            if (Date.now() - openedAtRef.current < 1500) return;
            markCurrentDone();
        }

        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [waitingForReturn, step, isLast]);

    function markCurrentDone() {
        setCompleted((prev) => new Set([...prev, step]));
        setWaitingForReturn(false);
        if (!isLast) setStep((value) => value + 1);
    }

    function handlePost() {
        navigator.clipboard.writeText(current).catch(() => {});
        const url = step === 0 && !over
            ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(current)}`
            : "https://twitter.com/compose/tweet";
        window.open(url, "_blank", "noopener,noreferrer");
        openedAtRef.current = Date.now();
        setWaitingForReturn(true);
    }

    if (allDone) {
        return (
            <div className="flex flex-col items-center justify-center gap-5 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                    <Check size={20} className="text-emerald-400" />
                </div>
                <div>
                    <p className="text-base font-semibold text-[#f0ede8]">Thread posted</p>
                    <p className="mt-1 text-xs text-[#555]">{total} tweets live on X</p>
                </div>
                <button
                    type="button"
                    onClick={onExit}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.05] px-4 py-2 text-xs font-semibold text-[#888] transition-colors hover:bg-white/[0.08]"
                >
                    Back to posts
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#555]">Post thread</span>
                    <div className="flex items-center gap-1.5">
                        {posts.map((_, i) => (
                            <div
                                key={i}
                                className={`rounded-full transition-all duration-200 ${
                                    completed.has(i)
                                        ? "h-2 w-2 bg-emerald-500"
                                        : i === step
                                            ? "h-2 w-3 bg-[#d4ff00]"
                                            : "h-2 w-2 bg-white/[0.1]"
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-[11px] font-mono text-[#555]">
                        {step + 1}/{total}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onExit}
                    className="rounded-lg p-1.5 text-[#555] transition-colors hover:bg-white/[0.05] hover:text-[#888]"
                >
                    <XIcon size={14} />
                </button>
            </div>

            {completed.size > 0 && (
                <div className="flex flex-col gap-1.5">
                    {[...completed].sort((a, b) => a - b).map((i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-3 py-2">
                            <Check size={11} className="shrink-0 text-emerald-400" />
                            <span className={`inline-flex items-center rounded border px-1.5 py-0 text-[9px] font-bold uppercase tracking-widest ${getStyle(posts[i].stage).badge}`}>
                                {posts[i].stage}
                            </span>
                            <span className="truncate text-xs text-[#666]">{posts[i].title}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className={`overflow-hidden rounded-xl border bg-[#0c0c0c] ${s.border}`}>
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${s.badge}`}>
                        {activePost.stage}
                    </span>
                    <span className="text-sm font-semibold text-[#f0ede8]">{activePost.title}</span>
                </div>

                {step > 0 && (
                    <div className="flex items-center gap-2 px-4 pt-3">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4ff00]" />
                        <p className="text-[11px] text-[#d4ff00]/70">Reply to your previous tweet to continue the thread</p>
                    </div>
                )}

                <div className="p-4">
                    <textarea
                        value={current}
                        onChange={(e) => {
                            const updated = [...contents];
                            updated[step] = e.target.value;
                            setContents(updated);
                        }}
                        rows={6}
                        className={`w-full resize-y rounded-xl border bg-[#090909] p-3 font-sans text-sm leading-relaxed text-[#f0ede8] outline-none transition-colors placeholder:text-[#444] ${
                            over
                                ? "border-red-500/50 focus:border-red-500"
                                : "border-white/[0.08] focus:border-[#d4ff00]/50"
                        }`}
                    />

                    <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {over ? (
                                <span className="text-xs font-mono text-red-400">
                                    {charCount - MAX_X} over limit - trim before posting
                                </span>
                            ) : (
                                <span className="text-xs font-mono text-[#555]">
                                    {MAX_X - charCount} chars remaining
                                </span>
                            )}
                        </div>
                        <span className={`text-xs font-mono font-bold ${over ? "text-red-400" : charCount > 240 ? "text-amber-400" : "text-[#555]"}`}>
                            {charCount}/{MAX_X}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
                    {waitingForReturn ? (
                        <>
                            <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#090909] px-4 py-2 text-xs text-[#555]">
                                <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#d4ff00]" />
                                Waiting for you to return...
                            </div>
                            <button
                                type="button"
                                onClick={markCurrentDone}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[#666] transition-colors hover:bg-white/[0.07]"
                            >
                                <Check size={11} />
                                {isLast ? "Done" : "Posted - next tweet ->"}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={handlePost}
                            disabled={over}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.15] bg-black px-4 py-2 text-xs font-bold text-white transition-colors hover:border-white/[0.25] hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
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

function PostCard({ post, index, total }: { post: JourneyPostData; index: number; total: number }) {
    const [copiedX, setCopiedX] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [, startTransition] = useTransition();
    const s = getStyle(post.stage);
    const isLast = index === total - 1;
    const content = getPostContent(post);
    const preview = content.length > 240 ? `${content.slice(0, 240)}...` : content;

    function handlePostX() {
        const text = encodeURIComponent(content);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener");
        setCopiedX(true);
        setTimeout(() => {
            startTransition(() => setCopiedX(false));
        }, 3500);
    }

    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center pt-1">
                <div className={`h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-[#090909] ${s.dot}`} />
                {!isLast && <div className="mt-1.5 w-px flex-1 bg-white/[0.08]" />}
            </div>

            <div className={`mb-6 flex-1 overflow-hidden rounded-xl border bg-[#0c0c0c] ${s.border}`}>
                <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${s.badge}`}>
                            {post.stage}
                        </span>
                        <span className="text-sm font-semibold text-[#f0ede8]">{post.title}</span>
                    </div>
                    <span className="shrink-0 text-[11px] font-mono text-[#555]">
                        {index + 1}/{total}
                    </span>
                </div>

                <div className="rounded-none border-b border-white/[0.08] bg-black p-4">
                    <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 shrink-0 rounded-full border border-white/[0.1] bg-[#1a1a1a]" />
                            <div className="flex items-center gap-x-1">
                                <span className="cursor-pointer text-[15px] font-bold text-[#f0ede8] hover:underline">Your Name</span>
                                <BadgeCheck size={16} className="fill-white text-[#1d9bf0]" />
                                <span className="text-[15px] text-[#666]">@yourhandle</span>
                                <span className="text-[15px] text-[#666]">.</span>
                                <span className="cursor-pointer text-[15px] text-[#666] hover:underline">3h</span>
                            </div>
                        </div>
                        <div className="cursor-pointer p-1 text-[#666] hover:text-[#aaa]">
                            <MoreHorizontal size={18} />
                        </div>
                    </div>

                    <div className="mb-3 whitespace-pre-wrap text-[15px] leading-normal text-[#f0ede8]">
                        {(expanded ? content : preview)
                            .split(/(#[a-zA-Z]\w*)/)
                            .map((part, i) => (
                                part.startsWith("#")
                                    ? <span key={i} className="cursor-pointer text-[#1d9bf0] hover:underline">{part}</span>
                                    : part
                            ))}
                    </div>

                    {content.length > 240 && (
                        <button
                            type="button"
                            onClick={() => setExpanded((value) => !value)}
                            className="mb-3 text-[15px] text-[#1d9bf0] hover:underline"
                        >
                            {expanded ? "Show less" : "Show more"}
                        </button>
                    )}

                    <div className="mt-2 flex items-center justify-between text-[#555]">
                        <div className="-ml-2 flex cursor-pointer items-center gap-1 transition-colors hover:text-[#1d9bf0]">
                            <div className="rounded-full p-2 transition-colors hover:bg-[#1d9bf0]/10"><MessageCircle size={18} /></div>
                            <span className="text-[13px]">62</span>
                        </div>
                        <div className="flex cursor-pointer items-center gap-1 transition-colors hover:text-[#00ba7c]">
                            <div className="rounded-full p-2 transition-colors hover:bg-[#00ba7c]/10"><Repeat2 size={18} /></div>
                            <span className="text-[13px]">12</span>
                        </div>
                        <div className="flex cursor-pointer items-center gap-1 transition-colors hover:text-[#f91880]">
                            <div className="rounded-full p-2 transition-colors hover:bg-[#f91880]/10"><Heart size={18} /></div>
                            <span className="text-[13px]">30</span>
                        </div>
                        <div className="flex cursor-pointer items-center gap-1 transition-colors hover:text-[#1d9bf0]">
                            <div className="rounded-full p-2 transition-colors hover:bg-[#1d9bf0]/10"><BarChart2 size={18} /></div>
                            <span className="text-[13px]">1.1K</span>
                        </div>
                        <div className="flex cursor-pointer items-center gap-0 transition-colors hover:text-[#1d9bf0]">
                            <div className="rounded-full p-2 transition-colors hover:bg-[#1d9bf0]/10"><Bookmark size={18} /></div>
                            <div className="rounded-full p-2 transition-colors hover:bg-[#1d9bf0]/10"><Share size={18} /></div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className={`text-[11px] font-mono ${content.length > MAX_X ? "text-red-400" : "text-[#555]"}`}>
                        {content.length}/{MAX_X}
                    </span>
                    <button
                        type="button"
                        onClick={handlePostX}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            copiedX
                                ? "bg-emerald-500 text-white"
                                : "border border-white/[0.12] bg-black text-white hover:border-white/[0.2] hover:bg-white/[0.06]"
                        }`}
                    >
                        {copiedX ? <><Check size={11} /> Opening X...</> : <><XLogo size={12} /> Post to X</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function StrategyJourneyCards({ posts }: { posts: JourneyPostData[] }) {
    const [threadMode, setThreadMode] = useState(false);

    if (!posts.length) return null;

    return (
        <div>
            <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#555]">
                    {posts.length}-post journey
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            {!threadMode && (
                <div className="mb-4 flex justify-end">
                    <button
                        type="button"
                        onClick={() => setThreadMode(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-black px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:border-white/[0.2] hover:bg-white/[0.06]"
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
