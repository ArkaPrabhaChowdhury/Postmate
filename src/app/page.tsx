"use client";

import { useSession } from "next-auth/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  ArrowRight, 
  Github, 
  Linkedin, 
  Twitter, 
  BrainCircuit, 
  History, 
  ShieldCheck, 
  Sparkles, 
  Share2, 
  Code2, 
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

export default function Home() {
  const { data: session } = useSession();
  const authed = !!session?.user;
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  return (
    <div ref={containerRef} className="relative flex flex-col items-center w-full min-h-screen">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 origin-left z-[60]"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-32 overflow-hidden px-4">
        {/* Background Gradients */}
        <div className="absolute inset-x-0 top-0 -z-10 h-[800px] w-full bg-[radial-gradient(ellipse_100%_100%_at_50%_0%,rgba(99,102,241,0.15),transparent)]" />
        <div className="absolute top-[20%] left-[-10%] -z-10 h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[-10%] -z-10 h-[400px] w-[400px] rounded-full bg-sky-500/10 blur-[120px]" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ scale, opacity }}
          className="text-center max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-xs font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Now supporting Gemini 1.5 Pro & OpenAI o1
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[0.9] text-gradient">
            Turn commits <br className="hidden md:block" />
            <span className="text-indigo-400">into content.</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Postmate helps developers transform their GitHub activity into high-engagement LinkedIn and X posts in seconds. Ship code, not just drafts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={authed ? "/dashboard" : "/signin"}
              className="group relative px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] flex items-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {authed ? "Go to Dashboard" : "Start Building for Free"}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="#features"
              className="px-8 py-4 glass hover:bg-zinc-900/50 text-zinc-100 font-bold rounded-xl transition-all flex items-center gap-2 border border-white/10"
            >
              Explore Features
            </Link>
          </div>
        </motion.div>

        {/* Visual Cue */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-zinc-500"
        >
          <ChevronDown size={30} />
        </motion.div>
      </section>

      {/* Trust Bar */}
      <section className="w-full py-16 border-y border-white/5 bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Connect with your world</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500 px-6">
          <div className="flex items-center gap-3"><Github size={32} /> <span className="font-bold text-xl tracking-tight">GitHub</span></div>
          <div className="flex items-center gap-3"><Linkedin size={32} /> <span className="font-bold text-xl uppercase tracking-tighter">LinkedIn</span></div>
          <div className="flex items-center gap-3"><Twitter size={32} /> <span className="font-bold text-xl italic uppercase">Twitter / X</span></div>
          </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="w-full py-32 px-6 sm:px-8 md:px-12 lg:px-16 max-w-7xl">
        <div className="mb-20 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Engineered for Momentum.</h2>
          <p className="text-zinc-500 text-xl max-w-2xl font-medium">Stop staring at your commits. Start sharing your journey with AI-powered narration that actually sounds like you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative p-8 rounded-3xl glass-darker overflow-hidden flex flex-col gap-6 hover:border-indigo-500/50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-500 leading-relaxed font-medium transition-colors group-hover:text-zinc-300 text-sm">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-32 relative overflow-hidden bg-white/2">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight text-gradient">Sync, Draft, Ship. <br /> In under 60 seconds.</h2>
              <div className="space-y-8">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-6 items-start group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-indigo-400 font-bold group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">{step.title}</h4>
                      <p className="text-zinc-500 font-medium">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Visual placeholder */}
            <div className="relative p-2 rounded-3xl shadow-2xl glass-darker overflow-hidden border border-white/10 group">
              <div className="aspect-[16/10] bg-zinc-900/50 rounded-2xl flex flex-col p-8 gap-4">
                <div className="h-2 w-1/3 bg-indigo-500/20 rounded-full" />
                <div className="h-8 w-full bg-white/5 rounded-lg border border-white/5" />
                <div className="h-24 w-full bg-white/2 rounded-lg border border-white/5 flex flex-col p-4 gap-2">
                   <div className="h-2 w-full bg-zinc-800 rounded-full" />
                   <div className="h-2 w-3/4 bg-zinc-800 rounded-full" />
                   <div className="h-2 w-1/2 bg-zinc-800 rounded-full" />
                </div>
                <div className="mt-auto flex justify-between items-center">
                   <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/40" />
                      <div className="w-6 h-6 rounded-full bg-sky-500/40" />
                   </div>
                   <div className="h-8 w-24 bg-indigo-500 rounded-lg" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-40" />
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[80px] group-hover:bg-indigo-500/40 transition-all duration-700" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="w-full py-40 px-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto glass p-12 md:p-24 rounded-[3rem] text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1),transparent_70%)]" />
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white tracking-tighter">Ready to build <br /> in public?</h2>
          <p className="text-zinc-400 text-xl mb-12 max-w-xl mx-auto font-medium">Join developers using Postmate to share their progress and build their personal brand.</p>
          <Link
            href={authed ? "/dashboard" : "/signin"}
            className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all text-lg shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
          >
            {authed ? "Explore Dashboard" : "Connect with GitHub"}
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-8 text-zinc-600 text-sm font-medium tracking-wide">Free forever plan available · Secure OAuth · Read-only access</p>
        </motion.div>
      </section>

      <footer className="w-full py-16 px-6 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white">P</div>
             <span className="font-bold text-xl tracking-tight">Postmate</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-zinc-500">
            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-sm text-zinc-600">© 2024 Postmate. Built for builders.</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: <BrainCircuit size={24} />,
    title: "AI Voice Sync",
    description: "Postmate learns your unique writing style. No more generic 'I am happy to share' vibes that everyone ignores."
  },
  {
    icon: <Github size={24} />,
    title: "Deep Git Context",
    description: "We don't just look at commit messages. We analyze file changes and READMEs for true technical insight."
  },
  {
    icon: <Sparkles size={24} />,
    title: "Draft Personality",
    description: "Switch between 'Technical Deep-dive', 'Build in Public', or 'Hype' styles with a single toggle."
  },
  {
    icon: <History size={24} />,
    title: "Ship History",
    description: "Keep track of your consistency. Automatically group related commits into cohesive project threads."
  },
  {
    icon: <Share2 size={24} />,
    title: "Cross-Platform",
    description: "Optimized formats for LinkedIn, X, and Threads. We handle the hashtags and character limits."
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Read-Only Security",
    description: "We never write to your repositories or post without your final approval. You maintain total control."
  }
];

const steps = [
  {
    title: "Connect Your GitHub",
    description: "Grant read-only access to your public or private repositories via secure OAuth."
  },
  {
    title: "Sync Your Activity",
    description: "Select recent commits, PRs, or releases you want to turn into a narrative."
  },
  {
    title: "Narrate & Ship",
    description: "Refine the AI draft in our beautiful editor and copy it to your social platform."
  }
];
