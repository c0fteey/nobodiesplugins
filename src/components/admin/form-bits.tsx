"use client";

import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const inputCls =
  "h-10 w-full rounded-md border border-white/10 bg-[#0f0f0f] px-3 text-sm outline-none transition placeholder:text-white/30 focus:border-brand aria-invalid:border-destructive";
export const textareaCls = cn(inputCls, "h-auto min-h-24 py-2 leading-relaxed");
// Trigger look for shadcn Select / date pickers inside admin forms, matching inputCls
export const selectCls =
  "h-10 rounded-md border-white/10 bg-[#0f0f0f] px-3 text-sm hover:border-white/20 dark:bg-[#0f0f0f] dark:hover:bg-[#141414] aria-invalid:border-destructive";

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("grid content-start gap-1.5", className)}>
      <span className="text-xs font-semibold text-white/80">{label}</span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : hint ? <span className="text-xs text-white/40">{hint}</span> : null}
    </label>
  );
}

/** On/off form field rendered as the shadcn Switch. */
export function Toggle<T extends FieldValues>({ label, control, name }: { label: string; control: Control<T>; name: Path<T> }) {
  const { field } = useController({ control, name });
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm select-none">
      <Switch
        checked={!!field.value}
        onCheckedChange={field.onChange}
        onBlur={field.onBlur}
        className="data-checked:bg-brand"
      />
      {label}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#171717] p-6">
      <h3 className="mb-5 text-sm font-bold tracking-wide text-white/90">{title}</h3>
      <div className="grid grid-cols-1 gap-4">{children}</div>
    </section>
  );
}
