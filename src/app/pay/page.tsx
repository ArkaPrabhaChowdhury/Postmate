import type { Metadata } from "next";
import { Suspense } from "react";
import PaddlePaymentLinkClient from "./payment-link-client";

export const metadata: Metadata = {
  title: "Secure Checkout",
  description: "Complete your Postmate subscription checkout.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default function PayPage() {
  return (
    <Suspense fallback={null}>
      <PaddlePaymentLinkClient />
    </Suspense>
  );
}
