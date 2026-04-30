import type { Metadata } from "next";
import PaddlePaymentLinkClient from "./payment-link-client";

export const metadata: Metadata = {
  title: "Secure Checkout",
  description: "Complete your Postmate subscription checkout.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PayPage() {
  return <PaddlePaymentLinkClient />;
}
