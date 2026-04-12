import { Resend } from "resend";
import type { IngestArticle } from "./news-ingest";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNewsDigestEmail(params: {
  to: string;
  name: string | null | undefined;
  articles: IngestArticle[];
}): Promise<void> {
  const { to, name, articles } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://postmate-six.vercel.app";
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi,";

  const articleRows = articles
    .map((a) => {
      const tweetList = a.tweets
        .map(
          (t) =>
            `<tr>
              <td style="padding:4px 0;vertical-align:top;width:80px;color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">${t.tone.replace("_", " ")}</td>
              <td style="padding:4px 0 4px 12px;font-size:13px;color:#e4e4e7;line-height:1.5;">${escapeHtml(t.tweet)}</td>
            </tr>`,
        )
        .join("");

      return `
        <div style="margin-bottom:24px;padding:16px;background:#18181b;border:1px solid #27272a;border-radius:10px;">
          <a href="${escapeHtml(a.url)}" style="font-size:14px;font-weight:600;color:#818cf8;text-decoration:none;" target="_blank">${escapeHtml(a.title)}</a>
          <table style="margin-top:12px;border-collapse:collapse;width:100%;">
            <tbody>${tweetList}</tbody>
          </table>
        </div>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#09090b;margin:0;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:0 auto;">
    <p style="color:#71717a;font-size:12px;margin:0 0 24px;">${greeting}</p>
    <p style="color:#e4e4e7;font-size:14px;margin:0 0 24px;">
      ${articles.length} new article${articles.length === 1 ? "" : "s"} just landed in your Postmate news queue — tweet drafts are ready to review.
    </p>
    ${articleRows}
    <div style="margin-top:32px;text-align:center;">
      <a href="${appUrl}/news" style="display:inline-block;padding:10px 24px;background:#4f46e5;color:#fff;font-size:13px;font-weight:600;border-radius:8px;text-decoration:none;">Review queue →</a>
    </div>
    <p style="margin-top:32px;font-size:11px;color:#52525b;text-align:center;">
      You're receiving this because auto-fetch is enabled in <a href="${appUrl}/news/settings" style="color:#71717a;">Postmate news settings</a>.
    </p>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Postmate <onboarding@resend.dev>",
    to,
    subject: `${articles.length} new article${articles.length === 1 ? "" : "s"} in your news queue`,
    html,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
