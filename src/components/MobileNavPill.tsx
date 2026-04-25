"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Newspaper, CreditCard, Settings, Sparkles, Tag } from "lucide-react";

type Item = { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> };

export function MobileNavPill({ loggedIn, isPro }: { loggedIn: boolean; isPro: boolean }) {
  const pathname = usePathname();

  const items: Item[] = loggedIn
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/news", label: "News", icon: Newspaper },
        ...(!isPro ? [{ href: "/pricing", label: "Pricing", icon: CreditCard }] : []),
        { href: "/settings", label: "Settings", icon: Settings },
      ]
    : [
        { href: "/#features", label: "Features", icon: Sparkles },
        { href: "/pricing", label: "Pricing", icon: Tag },
      ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/[0.08] rounded-full px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/dashboard"
            ? pathname === "/dashboard" || pathname.startsWith("/dashboard/")
            : href.startsWith("/#")
            ? false
            : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={
              "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-150 " +
              (active
                ? "bg-[#d4ff00] text-[#090909]"
                : "text-[#888] hover:text-[#f0ede8] hover:bg-white/[0.06]")
            }
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className={active ? "inline" : "hidden"}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
