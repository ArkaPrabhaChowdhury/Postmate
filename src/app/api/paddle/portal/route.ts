import { NextResponse } from "next/server";

export async function POST() {
  const url = process.env.PADDLE_CUSTOMER_PORTAL_URL;
  if (!url) return NextResponse.json({ error: "Paddle customer portal URL not configured" }, { status: 400 });
  return NextResponse.json({ url });
}
