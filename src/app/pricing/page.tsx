import { headers } from "next/headers";
import PricingClient from "./PricingClient";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const countryCode = (await headers()).get("x-vercel-ip-country")?.toUpperCase() ?? "US";
  return <PricingClient countryCode={countryCode} />;
}
