import Link from "next/link";
import { Sparkles } from "lucide-react";
import { headers } from "next/headers";
import { requireUserId } from "@/lib/requireUser";
import { getUserPlan } from "@/lib/plan-limits";
import { PLANS } from "@/lib/plans";
export default async function NewsLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUserId();
  const countryCode = (await headers()).get("x-vercel-ip-country")?.toUpperCase() ?? "US";
  const proPrice = countryCode === "IN" ? `₹${PLANS.pro.indiaPrice}` : `$${PLANS.pro.price}`;
  const plan = await getUserPlan(userId);
  const isPro = plan === "pro";

  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto px-6 sm:px-8 md:px-12 py-10">
        <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-8">
          <h1
            className="text-xl font-bold tracking-tight text-[#f0ede8]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            News is a Pro feature
          </h1>
          <p className="text-sm text-[#666] mt-2 max-w-xl">
            Upgrade to Pro to unlock the News queue, digest email, and history.
          </p>
          <p className="mt-4 text-sm font-semibold text-[#f0ede8]">
            {proPrice} one time · Lifetime access · No renewals
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] text-sm font-bold rounded-xl transition-colors"
            >
              <Sparkles size={14} />
              Get Pro · {proPrice}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-[#888] rounded-xl transition-all"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
