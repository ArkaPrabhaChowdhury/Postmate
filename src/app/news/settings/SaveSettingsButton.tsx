"use client";

import { useFormStatus } from "react-dom";

export function SaveSettingsButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d4ff00] hover:bg-[#c4ef00] text-[#090909] text-sm font-bold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <span className="w-3 h-3 rounded-full border-2 border-[#090909] border-t-transparent animate-spin" />
          Saving...
        </>
      ) : (
        "Save settings"
      )}
    </button>
  );
}
