"use client";

import { useState } from "react";
import { CheckIcon, CircleArrowDownIcon, CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { site } from "@/lang/site";

const t = site.licenses;

type LicenseRow = {
  id: string;
  key: string;
  productId: string;
  productName: string;
  status: "active" | "revoked";
  activations: number;
};

const mask = (key: string) => {
  const parts = key.split("-");
  return parts.map((p, i) => (i === 0 || i === parts.length - 1 ? p : "••••")).join("-");
};

export function LicenseTable({ licenses }: { licenses: LicenseRow[] }) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(row: LicenseRow) {
    try {
      await navigator.clipboard.writeText(row.key);
      setCopied(row.id);
      toast.success(t.copied);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error(t.clipboardError);
    }
  }

  if (licenses.length === 0) {
    return <p className="mt-10 text-sm text-white/50">{t.empty}</p>;
  }

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="text-[11px] font-bold tracking-[0.14em] text-white/60">
            <th className="pb-6 font-bold">{t.columns.key}</th>
            <th className="pb-6 font-bold">{t.columns.product}</th>
            <th className="pb-6 font-bold">{t.columns.status}</th>
            <th className="pb-6 font-bold">{t.columns.servers}</th>
            <th className="pb-6 text-right font-bold">{t.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {licenses.map((row) => (
            <tr key={row.id} className="border-t border-white/5 text-sm">
              <td className="py-5 font-mono text-xs">
                <span className="inline-flex items-center gap-2">
                  {revealed === row.id ? row.key : mask(row.key)}
                  <button type="button" aria-label={t.copy} onClick={() => copy(row)} className="text-white/50 hover:text-white">
                    {copied === row.id ? <CheckIcon className="size-3.5 text-success" /> : <CopyIcon className="size-3.5" />}
                  </button>
                  <button
                    type="button"
                    aria-label={revealed === row.id ? t.hide : t.show}
                    onClick={() => setRevealed((cur) => (cur === row.id ? null : row.id))}
                    className="text-white/50 hover:text-white"
                  >
                    {revealed === row.id ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
                  </button>
                </span>
              </td>
              <td className="py-5 font-semibold">
                <span className="inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-brand-soft" /> {row.productName}
                </span>
              </td>
              <td className="py-5">
                <span
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase",
                    row.status === "active" ? "border-brand-soft/50 bg-brand/15 text-brand-soft" : "border-destructive/50 text-destructive",
                  )}
                >
                  {t.statuses[row.status]}
                </span>
              </td>
              <td className="py-5 text-white/60">{row.activations ? t.activations(row.activations) : t.noActivity}</td>
              <td className="py-5 text-right">
                <a href={`/api/download/${row.productId}`} aria-label={t.download(row.productName)} className="inline-flex text-brand-soft hover:text-white">
                  <CircleArrowDownIcon className="size-5" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
