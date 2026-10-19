"use client";

import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export type Choice<T extends string> = { value: T; label: string };

/** shadcn Select for a plain list of options, with a <select>-like value/onChange API. */
export function ChoiceSelect<T extends string>({
  value,
  onChange,
  options,
  className,
  ...aria
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly Choice<T>[];
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => v != null && onChange(v as T)}>
      <SelectTrigger {...aria} className={cn("w-full cursor-pointer data-[size=default]:h-auto", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="cursor-pointer py-1.5">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
