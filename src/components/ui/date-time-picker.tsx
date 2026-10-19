"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const pad = (n: number) => String(n).padStart(2, "0");
// Same wire format as <input type="datetime-local">: "YYYY-MM-DDTHH:mm" in local time, "" = empty
const toValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parse = (v: string) => {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/** shadcn date picker with a time field; a drop-in for <input type="datetime-local"> in forms. */
export function DateTimePicker({
  value,
  onChange,
  placeholder,
  clearLabel,
  timeLabel,
  className,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  clearLabel: string;
  timeLabel: string;
  className?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const date = parse(value);
  const time = date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : "00:00";

  const pickDay = (day: Date | undefined) => {
    if (!day) return;
    const [h, m] = time.split(":").map(Number);
    day.setHours(h, m, 0, 0);
    onChange(toValue(day));
  };
  const pickTime = (hhmm: string) => {
    const base = date ?? new Date(new Date().setHours(0, 0, 0, 0));
    const [h, m] = hhmm.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    base.setHours(h, m, 0, 0);
    onChange(toValue(base));
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-invalid={invalid}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2 border text-left outline-none transition focus-visible:border-brand",
            !date && "text-white/40",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-white/50" />
          <span className="truncate">{date ? format(date, "d MMMM yyyy, HH:mm", { locale: tr }) : placeholder}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto border border-white/10 bg-[#1c1c1e] p-0">
          <Calendar
            mode="single"
            locale={tr}
            selected={date}
            defaultMonth={date}
            onSelect={pickDay}
            className="bg-transparent [--cell-size:--spacing(9)]"
          />
          <div className="flex items-center gap-2 border-t border-white/10 p-3">
            <span className="text-xs text-white/60">{timeLabel}</span>
            <input
              type="time"
              value={time}
              onChange={(e) => pickTime(e.target.value)}
              className="h-8 rounded-md border border-white/10 bg-[#0f0f0f] px-2 text-sm outline-none focus:border-brand"
            />
          </div>
        </PopoverContent>
      </Popover>
      {date && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={clearLabel}
          title={clearLabel}
          className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
