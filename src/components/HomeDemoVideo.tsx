"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";

const DEMO_URL =
  "https://pub-711711e24f95463bbe8ae8952b59f841.r2.dev/export-1778067201900.mp4";
const DEMO_POSTER = "/screenshots/image.png";

export function HomeDemoVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="demo" className="w-full border-y border-white/[0.05] bg-[#050807] px-6 py-16 sm:px-8 sm:py-20 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-9 max-w-3xl text-center">
          <div className="mb-4 font-mono text-[16px] uppercase text-[#d4ff00]">
            Demo
          </div>
          <h2
            className="text-3xl font-extrabold leading-tight text-[#f0ede8] sm:text-4xl"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            See Postmate in action.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#8d8d8d]">
            Watch GitHub work become a LinkedIn or X draft in one flow.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#d4ff00] bg-[#d4ff00] shadow-[#d4ff00]">
          <div className="flex h-11 items-center justify-between border-b border-white/[0.07] bg-[#101010] px-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-white/15" />
              <span className="h-3 w-3 rounded-full bg-white/15" />
              <span className="h-3 w-3 rounded-full bg-white/15" />
            </div>
          </div>

          <div className="relative aspect-video bg-black">
            {isPlaying ? (
              <video
                className="h-full w-full object-cover"
                src={DEMO_URL}
                poster={DEMO_POSTER}
                controls
                autoPlay
                playsInline
                preload="metadata"
              />
            ) : (
              <button
                type="button"
                aria-label="Play Postmate demo"
                onClick={() => setIsPlaying(true)}
                className="group relative h-full w-full overflow-hidden"
              >
                <Image
                  src={DEMO_POSTER}
                  alt="Postmate dashboard demo thumbnail"
                  fill
                  sizes="(min-width: 1280px) 1152px, 100vw"
                  className="object-cover"
                  priority={false}
                />
                <span className="absolute inset-0 bg-black/38 transition-colors group-hover:bg-black/30" />
                <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#d4ff00] text-[#050807] shadow-[0_0_38px_rgba(212,255,0,0.32)] transition-transform group-hover:scale-105">
                  <Play className="ml-1 h-8 w-8 fill-current" />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
