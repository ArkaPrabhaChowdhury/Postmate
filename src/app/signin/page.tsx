import { SignInButton } from "@/components/AuthButtons";
import { Shield, Lock, EyeOff } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="max-w-sm mx-auto mt-24 px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-xl shadow-black/50">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg width="24" height="24" viewBox="0 0 12 12" fill="none" className="text-white">
              <path d="M6 1L10.5 4V8L6 11L1.5 8V4L6 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-2">
          Sign in to Postmate
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
          Connect your GitHub account to start turning your commits into LinkedIn posts.
        </p>

        <SignInButton />

        {/* Trust Signals */}
        <div className="mt-8 flex flex-col gap-3">
          {[
            { icon: EyeOff, text: "Read-only access to your repos" },
            { icon: Lock, text: "We never commit code or post for you" },
            { icon: Shield, text: "No LinkedIn API required" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-500">
              <Icon size={14} className="text-indigo-400" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
