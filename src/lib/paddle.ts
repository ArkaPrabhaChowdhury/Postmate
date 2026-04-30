export { PLANS, getPlanFromPriceId } from "./plans";
export type { Plan } from "./plans";

const PADDLE_API_BASE = process.env.PADDLE_API_BASE_URL ?? "https://api.paddle.com";

async function paddleRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PADDLE_API_BASE}${path}`, {
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
  successUrl: string;
}) {
  return paddleRequest<{ data: { id: string; checkout: { url: string } } }>("/transactions", {
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
      checkout: {
        url: params.successUrl,
      },
    }),
  });
}
