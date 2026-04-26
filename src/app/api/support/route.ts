import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json();

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "All fields required." }, { status: 400 });
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "Postmate <onboarding@resend.dev>";

  const result = await resend.emails.send({
    from,
    to: "arkopra@gmail.com",
    replyTo: email,
    subject: `[Postmate Support] ${subject}`,
    html: `
      <div style="background:#09090b;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:560px;margin:0 auto;background:#0c0c0c;border:1px solid #27272a;border-radius:12px;padding:28px;">
          <p style="margin:0 0 4px;font-size:11px;color:#525252;font-family:monospace;">POSTMATE SUPPORT</p>
          <h2 style="margin:0 0 24px;font-size:18px;color:#f0ede8;">${escapeHtml(subject)}</h2>

          <table style="width:100%;margin-bottom:24px;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;font-size:12px;color:#525252;width:72px;">From</td>
              <td style="padding:6px 0;font-size:13px;color:#f0ede8;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:12px;color:#525252;">Email</td>
              <td style="padding:6px 0;font-size:13px;color:#818cf8;">${escapeHtml(email)}</td>
            </tr>
          </table>

          <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;padding:16px;">
            <p style="margin:0;font-size:13px;color:#e4e4e7;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</p>
          </div>

          <p style="margin:24px 0 0;font-size:11px;color:#52525b;">
            Reply directly to this email to respond to ${escapeHtml(name)}.
          </p>
        </div>
      </div>
    `,
  });

  if (result.error) {
    console.error("[support] resend error:", result.error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
