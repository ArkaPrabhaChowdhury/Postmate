import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import Link from "next/link";
import { getServerSession } from "next-auth";
import "./globals.css";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/AuthButtons";
import { ArrowRight } from "lucide-react";
import { Providers } from "@/components/Providers";

const spaceGrotesk = Space_Grotesk({ variable: "--font-sans", subsets: ["latin"] });
const spaceMono = Space_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: { default: "Postmate", template: "%s — Postmate" },
  description: "Turn GitHub commits into LinkedIn posts in seconds.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="bg-zinc-950 text-zinc-100 font-sans antialiased min-h-dvh">
        <style>{`
          details > summary {
            list-style: none;
          }
          details > summary::-webkit-details-marker {
            display: none;
          }
          details > summary .chevron {
            transition: transform 150ms ease;
          }
          details[open] > summary .chevron {
            transform: rotate(180deg);
          }
        `}</style>
        {/* Nav */}
        <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl transition-all duration-300">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-indigo-500/20">
                <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="text-white">
                  <path d="M6 1L10.5 4V8L6 11L1.5 8V4L6 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                Postmate
              </span>
            </Link>

            {/* Center nav */}
            {user && (
              <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                {[
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/news", label: "News" },
                  { href: "/settings", label: "Settings" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="px-4 py-1.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            )}

            {/* Right */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                    {user.image && (
                      <img
                        src={user.image}
                        alt={user.name ?? ""}
                        className="w-6 h-6 rounded-full border border-white/10"
                      />
                    )}
                    <span className="text-xs font-semibold text-zinc-300 truncate max-w-[100px]">{user.name}</span>
                  </div>
                  <SignOutButton />
                </>
              ) : (
                <Link
                  href="/signin"
                  className="group inline-flex items-center gap-2 px-5 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-all shadow-lg"
                >
                  Get Started
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="relative pt-16">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
