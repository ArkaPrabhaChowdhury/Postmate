import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { PostEditor } from "@/components/PostEditor";
import { markPostCopied, savePost, findPostImage, scorePostAction, regeneratePostAction, postToLinkedInNow, scheduleLinkedInPost, cancelLinkedInSchedule } from "../actions";
import { getLinkedInAccount } from "@/lib/linkedin";
import { ChevronLeft, ExternalLink } from "lucide-react";

const styleConfig: Record<string, { label: string; cls: string }> = {
  progress: { label: "Progress update", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  insight: { label: "Technical insight", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  build_in_public: { label: "Build in public", cls: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  project_showcase: { label: "Showcase", cls: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  trend: { label: "Trend", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-white/[0.06] text-[#888] border-white/[0.1]" },
  copied: { label: "Copied", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  posted: { label: "Posted", cls: "bg-[#d4ff00]/10 text-[#d4ff00] border-[#d4ff00]/20" },
};

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;

  const [post, linkedinAccount] = await Promise.all([
    prisma.generatedPost.findFirst({
      where: { id, userId },
      select: {
        id: true, content: true, style: true, status: true,
        sourceType: true, sourceId: true, createdAt: true,
        linkedinStatus: true, scheduledAt: true,
        repo: { select: { fullName: true } },
      },
    }),
    getLinkedInAccount(userId),
  ]);
  if (!post) notFound();

  const sc = styleConfig[post.style] ?? styleConfig.progress;
  const st = statusConfig[post.status] ?? statusConfig.draft;

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-[#666] hover:text-[#f0ede8] transition-colors w-fit"
          >
            <ChevronLeft size={13} />
            Dashboard
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1
                className="text-xl font-bold tracking-tight text-[#f0ede8]"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Edit draft
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {post.repo?.fullName && (
                  <a
                    href={`https://github.com/${post.repo.fullName}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#d4ff00]/70 hover:text-[#d4ff00] font-mono transition-colors"
                  >
                    {post.repo.fullName}
                    <ExternalLink size={10} />
                  </a>
                )}
                <code className="font-mono text-[11px] text-[#666] bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded">
                  {post.sourceId.slice(0, 7)}
                </code>
                <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold tracking-widest uppercase ${sc.cls}`}>
                  {sc.label}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold tracking-widest uppercase ${st.cls}`}>
                  {st.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-xl p-5">
          <PostEditor
            postId={post.id}
            initialContent={post.content}
            initialLinkedinStatus={post.linkedinStatus}
            initialScheduledAt={post.scheduledAt?.toISOString() ?? null}
            linkedinConnected={!!linkedinAccount?.access_token}
            onSave={savePost}
            onMarkCopied={markPostCopied}
            onPostLinkedIn={postToLinkedInNow}
            onScheduleLinkedIn={scheduleLinkedInPost}
            onCancelSchedule={cancelLinkedInSchedule}
            onFindImage={findPostImage}
            onScore={scorePostAction}
            onRegenerate={regeneratePostAction}
            repoFullName={post.repo?.fullName ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
