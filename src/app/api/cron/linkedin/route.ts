import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postToLinkedIn } from "@/lib/linkedin";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const results: Array<{ type: string; id: string; ok: boolean; error?: string }> = [];

  // Scheduled GeneratedPosts due now
  const duePosts = await prisma.generatedPost.findMany({
    where: {
      linkedinStatus: "scheduled",
      scheduledAt: { lte: now },
    },
    select: { id: true, userId: true, content: true },
  });

  for (const post of duePosts) {
    try {
      const linkedinPostId = await postToLinkedIn(post.userId, post.content);
      await prisma.generatedPost.update({
        where: { id: post.id },
        data: { linkedinStatus: "posted", linkedinPostId, status: "posted" },
      });
      results.push({ type: "post", id: post.id, ok: true });
    } catch (err) {
      await prisma.generatedPost.update({
        where: { id: post.id },
        data: { linkedinStatus: "failed" },
      });
      results.push({ type: "post", id: post.id, ok: false, error: String(err) });
    }
  }

  // Scheduled NewsTweets due now
  const dueTweets = await prisma.newsTweet.findMany({
    where: {
      linkedinStatus: "scheduled",
      scheduledAt: { lte: now },
    },
    select: { id: true, userId: true, tweet: true },
  });

  for (const tweet of dueTweets) {
    try {
      const linkedinPostId = await postToLinkedIn(tweet.userId, tweet.tweet);
      await prisma.newsTweet.update({
        where: { id: tweet.id },
        data: { linkedinStatus: "posted", linkedinPostId, status: "posted", postedAt: now },
      });
      results.push({ type: "tweet", id: tweet.id, ok: true });
    } catch (err) {
      await prisma.newsTweet.update({
        where: { id: tweet.id },
        data: { linkedinStatus: "failed" },
      });
      results.push({ type: "tweet", id: tweet.id, ok: false, error: String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
