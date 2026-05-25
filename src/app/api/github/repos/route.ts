import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listUserRepos } from "@/lib/github";

const PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pageParam = request.nextUrl.searchParams.get("page");
  const page = Number.parseInt(pageParam ?? "1", 10);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const repos = await listUserRepos(userId, {
    page: safePage,
    perPage: PAGE_SIZE,
  });

  return NextResponse.json({
    repos,
    page: safePage,
    hasMore: repos.length === PAGE_SIZE,
  });
}
