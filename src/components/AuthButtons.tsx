"use client";

import { signIn, signOut } from "next-auth/react";
import { Github, LogOut } from "lucide-react";

export function SignInButton() {
  return (
    <button
      onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
      className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-semibold rounded-xl transition-all shadow-sm"
    >
      <Github size={18} />
      Continue with GitHub
    </button>
  );
}

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center justify-center p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/80 rounded-lg transition-colors"
      aria-label="Sign out"
      title="Sign out"
    >
      <LogOut size={16} />
    </button>
  );
}
