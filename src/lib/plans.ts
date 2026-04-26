export const PLANS = {
  free: {
    name: "Free",
    priceIds: {
      monthly: null,
      yearly: null,
    },
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthlyEquivalent: 0,
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
    priceIds: {
      monthly: process.env.STRIPE_PRO_PRICE_ID,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    },
    monthlyPrice: 8,
    yearlyPrice: 60,
    yearlyMonthlyEquivalent: 5,
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
  if (priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) return "pro";
  return "free";
}
