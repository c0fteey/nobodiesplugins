"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CircleArrowDownIcon, CopyIcon, EyeIcon, EyeOffIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { regenerateMyLicenseAction } from "@/actions/account";
import { confirmDialog } from "@/components/ui/confirm-dialog";
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

// NB-CRATES-7KQ2-M9XA-4HTP -> NB-CRATES-••••-••••-4HTP (keeps the product part readable)
const mask = (key: string) => {
  const parts = key.split("-");
  const keep = parts[0] === "NB" ? 2 : 1;
  return parts.map((p, i) => (i < keep || i === parts.length - 1 ? p : "••••")).join("-");
};

export function LicenseTable({ licenses }: { licenses: LicenseRow[] }) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();

  async function regenerate(row: LicenseRow) {
    if (!(await confirmDialog({ title: t.regenerateConfirm, confirmLabel: t.regenerate }))) return;
    setBusy(row.id);
    start(async () => {
      const result = await regenerateMyLicenseAction(row.id);
      setBusy(null);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message);
      setRevealed(row.id);
      router.refresh();
    });
  }

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
                <span className="inline-flex items-center gap-3">
                  <button
                    type="button"
                    disabled={busy === row.id}
                    onClick={() => regenerate(row)}
                    aria-label={t.regenerate}
                    title={t.regenerate}
                    className="inline-flex text-white/50 transition hover:text-white disabled:opacity-50"
                  >
                    {busy === row.id ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />}
                  </button>
                  <a href={`/api/download/${row.productId}`} aria-label={t.download(row.productName)} className="inline-flex text-brand-soft hover:text-white">
                    <CircleArrowDownIcon className="size-5" />
                  </a>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
