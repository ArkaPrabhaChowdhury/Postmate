"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SignOutButton } from "@/components/AuthButtons";

export function SiteNavLinks() {
  const { data: session } = useSession();
  const user = session?.user;

  const links = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/news", label: "News" },
        { href: "/pricing", label: "Pricing" },
        { href: "/settings", label: "Settings" },
      ]
    : [
        { href: "/#features", label: "Features" },
        { href: "/pricing", label: "Pricing" },
      ];

  return (
    <>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="px-4 py-1.5 text-sm font-medium text-[#525252] hover:text-[#f0ede8] hover:bg-white/[0.06] rounded-lg transition-all duration-150"
        >
          {label}
        </Link>
      ))}
    </>
  );
}

export function SiteNavAccount() {
  const { data: session } = useSession();
  const user = session?.user;

  if (user) {
    return (
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
    );
  }

  return (
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
  );
}
