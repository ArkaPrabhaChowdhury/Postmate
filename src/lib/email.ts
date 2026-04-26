import { Resend } from "resend";
import type { IngestArticle } from "./news-ingest";
import type { WeeklyDigestCommit } from "./scoring";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNewsDigestEmail(params: {
  to: string;
  name: string | null | undefined;
  articles: IngestArticle[];
}): Promise<void> {
  const { to, name, articles } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://postmate.arkocodes.dev/";
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi,";

  const articleRows = articles
    .map((a) => `
        <div style="margin-bottom:24px;padding:16px;background:#18181b;border:1px solid #27272a;border-radius:10px;">
          <a href="${escapeHtml(a.url)}" style="font-size:14px;font-weight:600;color:#818cf8;text-decoration:none;" target="_blank">${escapeHtml(a.title)}</a>
          <p style="margin:12px 0 0;font-size:13px;color:#e4e4e7;line-height:1.5;">${escapeHtml(a.tweet)}</p>
        </div>`)
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

  const from = process.env.RESEND_FROM_EMAIL ?? "Postmate <onboarding@resend.dev>";
  // Resend sandbox only allows sending to the verified owner email
  const sandboxOwner = process.env.RESEND_SANDBOX_EMAIL;
  const recipient = !process.env.RESEND_FROM_EMAIL && sandboxOwner ? sandboxOwner : to;
  console.log(`[email] sending to=${recipient} (requested=${to}) from=${from} articles=${articles.length}`);

  const result = await resend.emails.send({
    from,
    to: recipient,
    subject: `${articles.length} new article${articles.length === 1 ? "" : "s"} in your news queue`,
    html,
  });

  if (result.error) {
    console.error(`[email] resend error:`, JSON.stringify(result.error));
    throw new Error(`Resend error: ${result.error.message}`);
  }

  console.log(`[email] sent id=${result.data?.id}`);
}

export async function sendWeeklyShippingDigestEmail(params: {
  to: string;
  name: string | null | undefined;
  repoFullName: string;
  totalCommits: number;
  worthPosting: WeeklyDigestCommit[];
}): Promise<void> {
  const { to, name, repoFullName, totalCommits, worthPosting } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://postmate.arkocodes.dev/";
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi,";
  const worthPostingCount = worthPosting.length;

  const commitRows = worthPosting
    .map((commit) => {
      const commitUrl = commit.url ?? `https://github.com/${repoFullName}/commit/${commit.sha}`;
      return `
        <div style="margin-bottom:16px;padding:14px;background:#18181b;border:1px solid #27272a;border-radius:10px;">
          <a href="${escapeHtml(commitUrl)}" style="font-size:14px;font-weight:600;color:#d4ff00;text-decoration:none;" target="_blank">${escapeHtml(commit.title)}</a>
          <p style="margin:10px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;">${escapeHtml(commit.sha.slice(0, 7))}</p>
        </div>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#09090b;margin:0;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:0 auto;">
    <p style="color:#71717a;font-size:12px;margin:0 0 24px;">${greeting}</p>
    <p style="color:#e4e4e7;font-size:15px;margin:0 0 8px;line-height:1.5;">
      You shipped <strong>${totalCommits} commit${totalCommits === 1 ? "" : "s"}</strong> this week.
      Postmate found <strong>${worthPostingCount}</strong> worth posting.
    </p>
    <p style="color:#71717a;font-size:12px;margin:0 0 24px;">Repository: ${escapeHtml(repoFullName)}</p>
    ${commitRows}
    <div style="margin-top:28px;text-align:center;">
      <a href="${appUrl}/dashboard" style="display:inline-block;padding:10px 24px;background:#d4ff00;color:#111827;font-size:13px;font-weight:700;border-radius:8px;text-decoration:none;">Open Postmate →</a>
    </div>
  </div>
</body>
</html>`;

  const from = process.env.RESEND_FROM_EMAIL ?? "Postmate <onboarding@resend.dev>";
  const sandboxOwner = process.env.RESEND_SANDBOX_EMAIL;
  const recipient = !process.env.RESEND_FROM_EMAIL && sandboxOwner ? sandboxOwner : to;
  console.log(`[email] weekly digest to=${recipient} (requested=${to}) from=${from} commits=${totalCommits} worthPosting=${worthPostingCount}`);

  const result = await resend.emails.send({
    from,
    to: recipient,
    subject: `You shipped ${totalCommits} commit${totalCommits === 1 ? "" : "s"} this week`,
    html,
  });

  if (result.error) {
    console.error(`[email] resend weekly digest error:`, JSON.stringify(result.error));
    throw new Error(`Resend error: ${result.error.message}`);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
