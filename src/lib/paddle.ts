import crypto from "node:crypto";

export { PLANS, getPlanFromPriceId } from "./plans";
export type { Plan } from "./plans";

const PADDLE_API_BASE = process.env.PADDLE_API_BASE_URL ?? "https://sandbox-api.paddle.com";

type PaddleRequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined>;
};

export type PaddleSubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "paused"
  | "canceled"
  | string;

export type PaddleSubscription = {
  id: string;
  status: PaddleSubscriptionStatus;
  customer_id?: string | null;
  custom_data?: Record<string, unknown> | null;
  current_billing_period?: { starts_at: string; ends_at: string } | null;
  scheduled_change?: { action: string; effective_at?: string | null } | null;
  items?: Array<{ price?: { id?: string | null } | null }>;
  management_urls?: {
    update_payment_method?: string | null;
    cancel?: string | null;
  } | null;
};

export type PaddleTransaction = {
  id: string;
  subscription_id?: string | null;
  customer_id?: string | null;
  custom_data?: Record<string, unknown> | null;
  items?: Array<{ price?: { id?: string | null } | null }>;
  checkout: { url: string };
};

function buildUrl(path: string, query?: PaddleRequestOptions["query"]) {
  const url = new URL(`${PADDLE_API_BASE}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function paddleRequest<T>(path: string, init?: PaddleRequestOptions): Promise<T> {
  const res = await fetch(buildUrl(path, init?.query), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PADDLE_API_KEY!}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) throw new Error(`Paddle API error (${res.status}): ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function createPaddleCheckout(params: {
  userId: string;
  email: string;
  name?: string;
  priceId: string;
  plan: string;
  billingInterval: "monthly" | "yearly";
}) {
  return paddleRequest<{ data: PaddleTransaction }>("/transactions", {
    method: "POST",
    body: JSON.stringify({
      items: [{ price_id: params.priceId, quantity: 1 }],
      customer: {
        email: params.email,
        name: params.name,
      },
      custom_data: {
        userId: params.userId,
        plan: params.plan,
        billingInterval: params.billingInterval,
      },
    }),
  });
}

export async function getPaddleTransaction(transactionId: string) {
  const response = await paddleRequest<{ data: PaddleTransaction }>(`/transactions/${transactionId}`);
  return response.data;
}

export async function getPaddleSubscription(subscriptionId: string) {
  const response = await paddleRequest<{ data: PaddleSubscription }>(`/subscriptions/${subscriptionId}`);
  return response.data;
}

export function verifyPaddleWebhookSignature(rawBody: string, signatureHeader: string, secret: string) {
  const parts = Object.fromEntries(
    signatureHeader
      .split(";")
      .map((part) => part.trim())
      .map((part) => {
        const index = part.indexOf("=");
        return index === -1 ? [part, ""] : [part.slice(0, index), part.slice(index + 1)];
      }),
  );

  const ts = parts.ts;
  const expected = parts.h1;
  if (!ts || !expected) return false;

  const payload = `${ts}:${rawBody}`;
  const actual = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
