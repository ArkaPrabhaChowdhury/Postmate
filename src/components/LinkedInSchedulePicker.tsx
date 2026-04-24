"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseDateValue(value: string) {
  // Preferred format: ISO string with timezone (e.g. 2026-04-23T13:20:00.000Z)
  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime())) return iso;

  // Backwards compatibility: local "datetime-local" style without timezone.
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, y, m, d, hh, mm] = match;
  const local = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), 0, 0);
  return Number.isNaN(local.getTime()) ? null : local;
}

function clampToMin(date: Date, min: Date) {
  return date.getTime() < min.getTime() ? new Date(min) : date;
}

function buildTimeOptions(stepMinutes: number) {
  const options: { value: string; label: string; minutes: number }[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const value = `${pad2(hours)}:${pad2(mins)}`;
    const hour12 = ((hours + 11) % 12) + 1;
    const ampm = hours < 12 ? "AM" : "PM";
    const label = `${hour12}:${pad2(mins)} ${ampm}`;
    options.push({ value, label, minutes });
  }
  return options;
}

export function LinkedInSchedulePicker(props: {
  value: string;
  onChange: (value: string) => void;
  min?: Date;
  stepMinutes?: number;
  className?: string;
}) {
  const stepMinutes = props.stepMinutes ?? 15;
  const minTs = props.min?.getTime();
  const min = useMemo(() => new Date(minTs ?? Date.now() + 60_000), [minTs]);

  const parsed = useMemo(() => parseDateValue(props.value), [props.value]);
  const initial = useMemo(() => clampToMin(parsed ?? min, min), [parsed, min]);

  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(initial);
  const [viewMonth, setViewMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (popoverRef.current && !popoverRef.current.contains(target)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    // Keep internal draft in sync when value changes externally.
    if (!parsed) return;
    setDraftDate(clampToMin(parsed, min));
    setViewMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
  }, [parsed, min]);

  const tz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "";
    }
  }, []);

  const monthLabel = useMemo(() => {
    return viewMonth.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [viewMonth]);

  const timeOptions = useMemo(() => buildTimeOptions(stepMinutes), [stepMinutes]);

  const selectedTime = useMemo(() => `${pad2(draftDate.getHours())}:${pad2(draftDate.getMinutes())}`, [draftDate]);

  const minDay = useMemo(() => startOfDay(min), [min]);

  function commit(nextDate: Date) {
    const clamped = clampToMin(nextDate, min);
    setDraftDate(clamped);
    setViewMonth(new Date(clamped.getFullYear(), clamped.getMonth(), 1));
    props.onChange(clamped.toISOString());
  }

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday=0
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - startWeekday);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [viewMonth]);

  const formattedSummary = useMemo(() => {
    const d = parsed ?? null;
    if (!d) return "Pick date & time";
    return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  }, [parsed]);

  function pickDay(day: Date) {
    const next = new Date(draftDate);
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());

    // If selecting the min day and the time is now invalid, bump to the first valid slot.
    commit(next);
  }

  function setTime(value: string) {
    const match = value.match(/^(\d{2}):(\d{2})$/);
    if (!match) return;
    const [, hh, mm] = match;
    const next = new Date(draftDate);
    next.setHours(Number(hh), Number(mm), 0, 0);
    commit(next);
  }

  return (
    <div className={props.className}>
      <button
        type="button"
        onClick={() => {
          if (!props.value) props.onChange(initial.toISOString());
          setOpen((v) => !v);
        }}
        className="w-full inline-flex items-center justify-between gap-2 bg-[#090909] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-[#f0ede8] outline-none hover:border-[#0A66C2]/50 transition-colors"
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          <Calendar size={14} className="text-[#666] shrink-0" />
          <span className="truncate">{formattedSummary}</span>
        </span>
        <Clock size={14} className="text-[#666] shrink-0" />
      </button>

      {open && (
        <div ref={popoverRef} className="relative">
          <div className="absolute z-50 mt-2 w-[320px] rounded-xl border border-white/[0.10] bg-[#0c0c0c] shadow-2xl p-3">
            <div className="flex items-center justify-between gap-2 mb-3">
              <button
                type="button"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="p-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-[#aaa] transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={14} />
              </button>
              <div className="text-xs font-semibold text-[#e0ddd8]">{monthLabel}</div>
              <button
                type="button"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="p-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-[#aaa] transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-[10px] text-[#555] mb-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-center py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const inMonth = day.getMonth() === viewMonth.getMonth();
                const disabled = startOfDay(day).getTime() < minDay.getTime();
                const selected = isSameDay(day, draftDate);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={disabled}
                    onClick={() => pickDay(day)}
                    className={[
                      "h-9 rounded-lg text-xs transition-colors",
                      inMonth ? "text-[#f0ede8]" : "text-[#555]",
                      disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-white/[0.06]",
                      selected ? "bg-[#0A66C2] text-white hover:bg-[#004182]" : "bg-white/[0.02]",
                    ].join(" ")}
                    aria-pressed={selected}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[10px] text-[#555] mb-1">Time</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#090909] border border-white/[0.1] rounded-lg px-2.5 py-2 text-xs text-[#f0ede8] outline-none focus:border-[#0A66C2]/50 transition-colors"
                >
                  {timeOptions.map((opt) => {
                    const optionDate = new Date(draftDate);
                    const hours = Math.floor(opt.minutes / 60);
                    const mins = opt.minutes % 60;
                    optionDate.setHours(hours, mins, 0, 0);
                    const disabled = optionDate.getTime() < min.getTime();
                    return (
                      <option key={opt.value} value={opt.value} disabled={disabled}>
                        {opt.label}
                      </option>
                    );
                  })}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 self-end px-3 py-2 text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#aaa] rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

            <div className="mt-2 text-[10px] text-[#555]">
              {tz ? `Time zone: ${tz}` : "Time zone: local"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
