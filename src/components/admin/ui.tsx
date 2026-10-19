import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-white/60">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand/85"
        >
          <PlusIcon className="size-4" /> {action.label}
        </Link>
      )}
    </div>
  );
}

export function AdminCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-xl border border-white/10 bg-[#171717]", className)}>{children}</div>;
}

export function StatusPill({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase",
        on ? "border-success/40 bg-success/10 text-success" : "border-white/15 text-white/50",
      )}
    >
      {on ? onLabel : offLabel}
    </span>
  );
}

export const th = "px-5 py-3 text-left text-[10px] font-bold tracking-[0.14em] text-white/50";
export const td = "px-5 py-4 text-sm";
