import type { Metadata } from "next";
import { Syne, DM_Sans, Space_Mono } from "next/font/google";
import Link from "next/link";
import { getServerSession } from "next-auth";
import "./globals.css";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/AuthButtons";
import { ArrowRight } from "lucide-react";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import { prisma } from "@/lib/prisma";
import { MobileNavPill } from "@/components/MobileNavPill";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://postmate.arkocodes.dev"),
  title: { default: "Postmate", template: "%s | Postmate" },
  description: "Turn GitHub commits into LinkedIn posts in seconds.",
  applicationName: "Postmate",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Postmate",
    description: "Turn GitHub commits into LinkedIn posts in seconds.",
    url: "/",
    siteName: "Postmate",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/social-card-v3.png",
        width: 1200,
        height: 630,
        alt: "Postmate - Turn GitHub commits into LinkedIn posts in seconds.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Postmate",
    description: "Turn GitHub commits into LinkedIn posts in seconds.",
    images: ["/social-card-v3.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

function PostmateLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="28" height="28" rx="7" fill="#d4ff00" />
      <rect x="5" y="7.5" width="12" height="2.5" rx="1.25" fill="#090909" />
      <rect x="5" y="12.75" width="9" height="2.5" rx="1.25" fill="#090909" />
      <rect x="5" y="18" width="6" height="2.5" rx="1.25" fill="#090909" />
      <path d="M22.5 14L18 9.5V18.5L22.5 14Z" fill="#090909" />
    </svg>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const isPro = user?.id
    ? (await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } }))?.plan === "pro"
    : false;

  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${spaceMono.variable}`}
    >
      <body className="bg-[#090909] text-[#f0ede8] font-sans antialiased min-h-dvh">
        <style>{`
          details > summary { list-style: none; }
          details > summary::-webkit-details-marker { display: none; }
          details > summary .chevron { transition: transform 150ms ease; }
          details[open] > summary .chevron { transform: rotate(180deg); }
        `}</style>

        {/* Nav */}
        <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/[0.05] bg-[#090909]/85 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="group-hover:scale-105 transition-transform duration-200">
                <PostmateLogo />
              </div>
              <span
                className="font-display font-bold text-[15px] tracking-tight text-[#f0ede8]"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Postmate
              </span>
            </Link>

            {/* Center nav */}
            <nav className="hidden md:flex items-center gap-0.5 bg-white/[0.04] p-1 rounded-xl border border-white/[0.05]">
              {(user
                ? [
                    { href: "/dashboard", label: "Dashboard" },
                    { href: "/news", label: "News" },
                    ...(!isPro ? [{ href: "/pricing", label: "Pricing" }] : []),
                    { href: "/settings", label: "Settings" },
                  ]
                : [
                    { href: "/#features", label: "Features" },
                    { href: "/pricing", label: "Pricing" },
                  ]
              ).map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-4 py-1.5 text-sm font-medium text-[#525252] hover:text-[#f0ede8] hover:bg-white/[0.06] rounded-lg transition-all duration-150"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-white/[0.04] rounded-xl border border-white/[0.05]">
                    {user.image && (
                      <img
                        src={user.image}
                        alt={user.name ?? ""}
                        className="w-5 h-5 rounded-full border border-white/10"
                      />
                    )}
                    <span className="text-xs font-medium text-[#888] truncate max-w-[100px]">
                      {user.name}
                    </span>
                  </div>
                  <SignOutButton />
                </>
              ) : (
                <Link
                  href="/signin"
                  className="group inline-flex items-center gap-1.5 px-4 py-2 bg-[#d4ff00] text-[#090909] text-sm font-bold rounded-xl hover:bg-[#c4ef00] transition-colors"
                >
                  Get Started
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="relative pt-14 pb-24 md:pb-0 min-h-[calc(100dvh-5rem)]">
          <Providers>{children}</Providers>
        </main>

        {/* Mobile floating nav pill */}
        <MobileNavPill loggedIn={!!user} isPro={isPro} />

        {/* Global Footer */}
        <footer className="w-full py-10 border-t border-white/[0.04] bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <PostmateLogo size={20} />
              <span
                className="font-bold text-sm tracking-tight text-[#f0ede8]"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Postmate
              </span>
            </div>

            <div className="flex items-center gap-8">
              <Link
                href="/pricing"
                className="text-[12px] text-[#525252] hover:text-[#d4ff00] transition-colors font-mono tracking-tight"
              >
                Pricing
              </Link>
              <Link
                href="/privacy"
                className="text-[12px] text-[#525252] hover:text-[#d4ff00] transition-colors font-mono tracking-tight"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-[12px] text-[#525252] hover:text-[#d4ff00] transition-colors font-mono tracking-tight"
              >
                Terms
              </Link>
              <Link
                href="/refund"
                className="text-[12px] text-[#525252] hover:text-[#d4ff00] transition-colors font-mono tracking-tight"
              >
                Refunds
              </Link>
              <Link
                href="/support"
                className="text-[12px] text-[#525252] hover:text-[#d4ff00] transition-colors font-mono tracking-tight"
              >
                Support
              </Link>
              <p className="text-[12px] text-[#525252] font-mono tracking-tight">
                © 2026 Postmate. Built for builders.
              </p>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
