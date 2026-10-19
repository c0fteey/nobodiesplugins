"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BanIcon, CheckIcon, CopyIcon, Loader2Icon, RefreshCwIcon, RotateCcwIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { regenerateLicenseAction, setLicenseStatusAction, type AdminResult } from "@/actions/admin";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { timeAgo } from "@/lib/format";
import { admin } from "@/lang/admin";
import { inputCls, selectCls } from "./form-bits";
import { StatusPill, td, th } from "./ui";

const t = admin.licenses;

type Row = {
  id: string;
  key: string;
  status: "active" | "revoked";
  activations: number;
  lastSeenAt: string | null;
  lastServer: string | null;
  productName: string;
  email: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: t.statuses.all },
  { value: "active", label: t.statuses.active },
  { value: "revoked", label: t.statuses.revoked },
] as const;

export function LicensesAdmin({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "revoked">("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (!q || r.key.toLowerCase().includes(q) || r.productName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)),
    );
  }, [rows, query, status]);

  const run = (id: string, fn: () => Promise<AdminResult>, message: string) => {
    setBusy(id);
    start(async () => {
      const result = await fn();
      setBusy(null);
      if (!result.ok) return void toast.error(result.error);
      toast.success(message);
      router.refresh();
    });
  };

  const copy = async (key: string) => {
    await navigator.clipboard.writeText(key).catch(() => {});
    toast.success(t.copied);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-64 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} className={`${inputCls} pl-9`} />
        </div>
        <ChoiceSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} aria-label={t.columns.status} className={`${selectCls} w-40`} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#171717]">
        <table className="w-full min-w-[900px]">
          <thead className="border-b border-white/5">
            <tr>
              <th className={th}>{t.columns.key}</th>
              <th className={th}>{t.columns.product}</th>
              <th className={th}>{t.columns.user}</th>
              <th className={th}>{t.columns.status}</th>
              <th className={th}>{t.columns.usage}</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-b border-white/5 last:border-0">
                <td className={`${td} font-mono text-xs`}>
                  <span className="inline-flex items-center gap-2">
                    {r.key}
                    <button type="button" onClick={() => copy(r.key)} aria-label={t.copied} className="text-white/40 hover:text-white">
                      <CopyIcon className="size-3.5" />
                    </button>
                  </span>
                </td>
                <td className={`${td} font-semibold`}>{r.productName}</td>
                <td className={`${td} text-white/70`}>{r.email}</td>
                <td className={td}>
                  <StatusPill on={r.status === "active"} onLabel={t.statuses.active} offLabel={t.statuses.revoked} />
                </td>
                <td className={`${td} text-xs text-white/60`}>
                  <span className="block font-semibold text-white/80">{t.activations(r.activations)}</span>
                  {r.lastSeenAt ? t.lastSeen(timeAgo(new Date(r.lastSeenAt)), r.lastServer) : t.never}
                </td>
                <td className={`${td} text-right`}>
                  <span className="inline-flex items-center gap-2">
                    {busy === r.id && <Loader2Icon className="size-4 animate-spin text-white/50" />}
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={async () =>
                        (await confirmDialog({ title: t.regenerateConfirm, confirmLabel: t.regenerate })) &&
                        run(r.id, () => regenerateLicenseAction(r.id), t.regenerated)
                      }
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 px-2.5 text-xs font-semibold text-white/75 transition hover:border-white/30 hover:text-white"
                    >
                      <RefreshCwIcon className="size-3.5" /> {t.regenerate}
                    </button>
                    {r.status === "active" ? (
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={async () =>
                          (await confirmDialog({ title: t.revokeConfirm, confirmLabel: t.revoke })) &&
                          run(r.id, () => setLicenseStatusAction({ id: r.id, status: "revoked" }), t.updated)
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-destructive/30 px-2.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
                      >
                        <BanIcon className="size-3.5" /> {t.revoke}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => run(r.id, () => setLicenseStatusAction({ id: r.id, status: "active" }), t.updated)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-success/30 px-2.5 text-xs font-semibold text-success transition hover:bg-success/10"
                      >
                        <RotateCcwIcon className="size-3.5" /> {t.activate}
                      </button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className={`${td} text-white/50`}>
                  <span className="inline-flex items-center gap-2">
                    <CheckIcon className="size-4" /> {rows.length ? t.noResults : t.empty}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
