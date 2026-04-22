export const PLANS = {
  free: {
    name: "Free",
    priceId: null,
    monthlyPrice: 0,
    repos: 1,
    postsPerMonth: 5,
    features: [
      "1 GitHub repo",
      "5 AI posts / month",
      "Progress style only",
    ],
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    monthlyPrice: 8,
    repos: Infinity,
    postsPerMonth: Infinity,
    features: [
      "Unlimited repos",
      "Unlimited AI posts",
      "All 4 post styles",
      "Journey & showcase posts",
      "News tweet generation",
      "Voice memory & tone",
      "Email digest",
      "Post scheduler (coming soon)",
      "Auto-post to LinkedIn / X (coming soon)",
    ],
  },
} as const;

export type Plan = keyof typeof PLANS;

export function getPlanFromPriceId(priceId: string): Plan {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  return "free";
}
