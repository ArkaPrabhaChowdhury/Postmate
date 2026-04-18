"use client";

export function StopPropagation({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3 ml-auto mr-3" onClick={(e) => e.preventDefault()}>{children}</div>;
}
