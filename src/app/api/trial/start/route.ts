import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "New Pro trials are no longer available." }, { status: 410 });
}
