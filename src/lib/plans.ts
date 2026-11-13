export const PLANS = {
  free: {
    name: "Free",
    repos: 1,
    postsPerMonth: 5,
    features: [
      "1 active public GitHub repo",
      "5 AI posts / month",
      "Progress style only",
    ],
  },
  pro: {
    name: "Pro",
    priceId: process.env.PADDLE_PRO_ONETIME_PRICE_ID,
    price: 10,
    indiaPrice: 499,
    repos: Infinity,
    postsPerMonth: Infinity,
    features: [
      "Unlimited saved public repos",
      "Unlimited AI posts",
      "All 4 post styles",
      "Journey & showcase posts",
      "News tweet generation",
      "Voice memory & tone",
      "Email digest",
      "Publish or schedule LinkedIn drafts",
    ],
  },
} as const;

export type Plan = keyof typeof PLANS;

export function getPlanFromPriceId(priceId: string): Plan {
  if (isOneTimePriceId(priceId)) return "pro";
  // Keep access synced for customers on the retired subscription prices.
  if (priceId === process.env.PADDLE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.PADDLE_PRO_YEARLY_PRICE_ID) return "pro";
  return "free";
}

export function isOneTimePriceId(priceId: string) {
  return priceId === process.env.PADDLE_PRO_ONETIME_PRICE_ID;
}
