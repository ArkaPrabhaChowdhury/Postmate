"use client";

import { useState, useTransition, useRef } from "react";
import { Fingerprint, Check, ChevronRight } from "lucide-react";

type Props = {
  initialVoiceMemory: string;
  initialTone: string;
  onSave: (fd: FormData) => Promise<void>;
  onAutoGenerate: () => Promise<string>;
};

export function VoiceSettingsSection({ initialVoiceMemory, initialTone, onSave, onAutoGenerate }: Props) {
  const [voiceMemory, setVoiceMemory] = useState(initialVoiceMemory);
  const [tone, setTone] = useState(initialTone);
  const [saved, setSaved] = useState(false);
  const [generating, startGenerating] = useTransition();
  const [generated, setGenerated] = useState(false);
  const [saving, startSaving] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleAutoGenerate() {
    setGenerated(false);
    startGenerating(async () => {
      const result = await onAutoGenerate();
      setVoiceMemory(result);
      setGenerated(true);
      setTimeout(() => setGenerated(false), 4000);
      textareaRef.current?.focus();
    });
  }

  function handleSave() {
    const fd = new FormData();
    fd.set("voiceMemory", voiceMemory);
    fd.set("tone", tone);
    startSaving(async () => {
      await onSave(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  const toneLabel = Number(tone) <= 20 ? "Concise" : Number(tone) >= 80 ? "Bold" : "Balanced";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <label className="text-xs font-semibold text-[#888]">Voice memory</label>
          <button
            type="button"
            onClick={handleAutoGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-[#aaa] rounded-lg transition-colors disabled:opacity-60"
          >
            {generating ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full border-2 border-[#aaa] border-t-transparent animate-spin" />
                Analyzing GitHub…
              </>
            ) : generated ? (
              <>
                <Check size={11} className="text-emerald-400" />
                <span className="text-emerald-400">Done</span>
              </>
            ) : (
              <>
                <Fingerprint size={11} />
                Auto-generate from GitHub
              </>
            )}
          </button>
        </div>

        {generated && (
          <div className="mb-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Check size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-emerald-400 leading-snug">
              Voice fingerprint generated from your GitHub commit messages, README excerpts, and bio. Review and edit below before saving.
            </p>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={voiceMemory}
          onChange={(e) => setVoiceMemory(e.target.value)}
          className="w-full h-24 resize-y bg-[#090909] border border-white/[0.08] rounded-xl p-3 text-sm text-[#f0ede8] leading-relaxed outline-none focus:border-[#d4ff00]/50 transition-colors"
          placeholder="Short phrases, tone quirks, or stylistic rules you want in every post. Or click 'Auto-generate' to analyze your GitHub writing style."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-[#888]">Tone</label>
          <span className="text-xs text-[#666]">{toneLabel}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="w-full accent-[#d4ff00]"
        />
        <div className="mt-1 text-[11px] text-[#555]">0 = concise · 50 = balanced · 100 = bold</div>
      </div>

      <div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] rounded-lg transition-colors disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-[#090909] border-t-transparent animate-spin" />
              Saving…
            </>
          ) : saved ? (
            <>
              <Check size={12} />
              Saved
            </>
          ) : (
            "Save preferences"
          )}
        </button>
      </div>
    </div>
  );
}
