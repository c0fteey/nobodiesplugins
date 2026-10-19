import { cn } from "@/lib/utils";

export const inputCls =
  "h-10 w-full rounded-md border border-white/10 bg-[#0f0f0f] px-3 text-sm outline-none transition placeholder:text-white/30 focus:border-brand aria-invalid:border-destructive";
export const textareaCls = cn(inputCls, "h-auto min-h-24 py-2 leading-relaxed");

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

/** On/off setting, styled as a switch (see `.switch` in globals.css). */
export function Toggle({ label, ...props }: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" role="switch" className="switch" {...props} />
      {label}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#171717] p-6">
      <h3 className="mb-5 text-sm font-bold tracking-wide text-white/90">{title}</h3>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}
