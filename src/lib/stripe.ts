import Stripe from "stripe";
export { PLANS, getPlanFromPriceId } from "./plans";
export type { Plan } from "./plans";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia" as const,
  typescript: true,
});
