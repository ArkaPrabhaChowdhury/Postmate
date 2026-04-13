"use client";

import { useState, useTransition } from "react";
import { Linkedin, Twitter, Check, MessageCircle, Repeat2, Heart, BarChart2, Bookmark, Share, MoreHorizontal, BadgeCheck } from "lucide-react";

export type JourneyPostData = {
    title: string;
    stage: string;
    emoji: string;
    content: string;
};

const stageStyles: Record<string, { dot: string; badge: string; border: string }> = {
    origin: { dot: "bg-violet-500", badge: "bg-violet-500/10 text-violet-400 border-violet-500/20", border: "border-violet-500/20" },
    build: { dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20", border: "border-blue-500/20" },
    launch: { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", border: "border-emerald-500/20" },
    milestone: { dot: "bg-indigo-500", badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", border: "border-indigo-500/20" },
    challenge: { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20", border: "border-amber-500/20" },
    growth: { dot: "bg-teal-500", badge: "bg-teal-500/10 text-teal-400 border-teal-500/20", border: "border-teal-500/20" },
    reflection: { dot: "bg-[#555]", badge: "bg-white/[0.06] text-[#888] border-white/[0.1]", border: "border-white/[0.1]" },
};

function getStyle(stage: string) {
    return stageStyles[stage] ?? stageStyles.reflection;
}

function PostCard({ post, index, total }: { post: JourneyPostData; index: number; total: number }) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [, startTransition] = useTransition();
    const s = getStyle(post.stage);
    const isLast = index === total - 1;
    const preview = post.content.length > 240 ? post.content.slice(0, 240) + "…" : post.content;

    const [copiedX, setCopiedX] = useState(false);

    function handlePost() {
        navigator.clipboard.writeText(post.content).catch(() => { });
        setCopied(true);
        startTransition(() => { });
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
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0" />
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
                            onClick={() => setExpanded((v) => !v)}
                            className="text-[15px] text-[#1d9bf0] hover:underline mb-3"
                        >
                            {expanded ? "Show less" : "Show more"}
                        </button>
                    )}

                    {/* Reactions */}
                    <div className="flex items-center justify-between text-[#555] mt-2">
                        <div className="flex items-center gap-1 group cursor-pointer hover:text-[#1d9bf0] transition-colors -ml-2">
                            <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                                <MessageCircle size={18} />
                            </div>
                            <span className="text-[13px]">62</span>
                        </div>
                        <div className="flex items-center gap-1 group cursor-pointer hover:text-[#00ba7c] transition-colors">
                            <div className="p-2 rounded-full group-hover:bg-[#00ba7c]/10 transition-colors">
                                <Repeat2 size={18} />
                            </div>
                            <span className="text-[13px]">12</span>
                        </div>
                        <div className="flex items-center gap-1 group cursor-pointer hover:text-[#f91880] transition-colors">
                            <div className="p-2 rounded-full group-hover:bg-[#f91880]/10 transition-colors">
                                <Heart size={18} />
                            </div>
                            <span className="text-[13px]">30</span>
                        </div>
                        <div className="flex items-center gap-1 group cursor-pointer hover:text-[#1d9bf0] transition-colors">
                            <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                                <BarChart2 size={18} />
                            </div>
                            <span className="text-[13px]">1.1K</span>
                        </div>
                        <div className="flex items-center gap-0 group cursor-pointer hover:text-[#1d9bf0] transition-colors">
                            <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                                <Bookmark size={18} />
                            </div>
                            <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                                <Share size={18} />
                            </div>
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
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ${copied
                                ? "bg-emerald-500 text-white"
                                : "bg-[#0A66C2] hover:bg-[#004182] text-white"
                                }`}
                        >
                            {copied ? (
                                <><Check size={11} /> Copied</>
                            ) : (
                                <><Linkedin size={12} /> LinkedIn</>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handlePostX}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ${copiedX
                                ? "bg-emerald-500 text-white"
                                : "bg-black hover:bg-white/[0.06] text-white border border-white/[0.12] hover:border-white/[0.2]"
                                }`}
                        >
                            {copiedX ? (
                                <><Check size={11} /> Opening X…</>
                            ) : (
                                <><Twitter size={12} /> Post to X</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function StrategyJourneyCards({ posts }: { posts: JourneyPostData[] }) {
    if (!posts.length) return null;
    return (
        <div>
            <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#555]">
                    {posts.length}-post journey
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <div>
                {posts.map((post, i) => (
                    <PostCard key={i} post={post} index={i} total={posts.length} />
                ))}
            </div>
        </div>
    );
}
