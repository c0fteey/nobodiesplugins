"use client";

import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "./select";

export type Choice<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
  /** Small colored dot before the label (roles) */
  color?: string;
  /** Muted text after the label, e.g. a product type */
  hint?: string;
  /** Icon before the label (block icons) */
  icon?: React.ReactNode;
};
export type ChoiceGroup<T extends string> = { label: string; options: readonly Choice<T>[] };

/**
 * shadcn Select for a list of options, with a <select>-like value/onChange API.
 * Pass `options` for a flat list or `groups` for labelled sections. An empty
 * string value shows `placeholder`.
 */
export function ChoiceSelect<T extends string>({
  value,
  onChange,
  options,
  groups,
  placeholder,
  disabled,
  className,
  ...aria
}: {
  value: T | "";
  onChange: (value: T) => void;
  options?: readonly Choice<T>[];
  groups?: readonly ChoiceGroup<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  title?: string;
}) {
  const sections = groups ?? [{ label: "", options: options ?? [] }];
  const all = sections.flatMap((s) => s.options);
  const items: { value: string; label: string }[] = [
    ...(placeholder ? [{ value: "", label: placeholder }] : []),
    ...all.map((o) => ({ value: o.value as string, label: o.label })),
  ];
  const selected = all.find((o) => o.value === value);

  return (
    <Select<string> items={items} value={value as string} disabled={disabled} onValueChange={(v) => v != null && v !== "" && onChange(v as T)}>
      <SelectTrigger
        {...aria}
        className={cn("w-full cursor-pointer data-[size=default]:h-auto", value === "" && "text-white/40", className)}
      >
        {selected?.color && <span className="size-2 shrink-0 rounded-full" style={{ background: selected.color }} />}
        {selected?.icon}
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="max-h-80 border border-white/10 bg-[#1c1c1e]">
        {sections.map((section, i) => (
          <SelectGroup key={section.label || i}>
            {i > 0 && <SelectSeparator />}
            {section.label && <SelectLabel className="px-2 pt-1.5 text-[10px] font-bold tracking-[0.12em] uppercase">{section.label}</SelectLabel>}
            {section.options.map((o) => (
              <SelectItem key={o.value} value={o.value} disabled={o.disabled} className="cursor-pointer py-1.5">
                {o.color && <span className="size-2 shrink-0 rounded-full" style={{ background: o.color }} />}
                {o.icon}
                {o.label}
                {o.hint && <span className="ml-auto pl-3 text-[11px] text-white/40">{o.hint}</span>}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
