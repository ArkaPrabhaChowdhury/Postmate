import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getServerSession } from "next-auth";
import "./globals.css";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/AuthButtons";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Postmate", template: "%s — Postmate" },
  description: "Turn GitHub commits into LinkedIn posts in seconds.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
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
        <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-5 h-12 flex items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-400 transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white">
                  <path d="M6 1L10.5 4V8L6 11L1.5 8V4L6 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-semibold text-sm tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                Postmate
              </span>
            </Link>

            {/* Center nav */}
            {user && (
              <nav className="flex items-center gap-0.5">
                {[
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/settings", label: "Settings" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-md transition-all duration-150"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            )}

            {/* Right */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {user.image && (
                    <img
                      src={user.image}
                      alt={user.name ?? ""}
                      className="w-7 h-7 rounded-full border border-zinc-700"
                    />
                  )}
                  <SignOutButton />
                </>
              ) : (
                <Link
                  href="/signin"
                  className="text-sm font-medium px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-md transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="mx-auto max-w-6xl px-5 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
