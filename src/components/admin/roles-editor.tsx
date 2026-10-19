"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, LockIcon, PlusIcon, RefreshCwIcon, SaveIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@/db/schema";
import { deleteRoleAction, recalcRolesAction, saveRoleAction, type AdminResult } from "@/actions/admin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { admin } from "@/lang/admin";
import { inputCls } from "./form-bits";

const t = admin.roles;

type RoleRow = { role: Role; users: number | null };

// Threshold input is in euros; "" means a manual role
const toEuros = (cents: number | null) => (cents == null ? "" : String(cents / 100));
const toMinSpend = (value: string) => (value.trim() === "" ? null : Number(value.replace(",", ".")));

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<AdminResult>, message: string, after?: () => void) =>
    start(async () => {
      const result = await fn();
      if (!result.ok) return void toast.error(result.error);
      toast.success(message);
      after?.();
      router.refresh();
    });
  return { pending, start, run };
}

export function RolesEditor({ rows }: { rows: RoleRow[] }) {
  return (
    <div className="space-y-6">
      <AutoRolesAlert />
      <NewRoleForm />
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#171717]">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-white/5">
            <tr className="text-left text-[10px] font-bold tracking-[0.14em] text-white/50">
              <th className="px-5 py-3">{t.columns.role}</th>
              <th className="px-5 py-3">{t.columns.threshold}</th>
              <th className="px-5 py-3">{t.columns.users}</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <RoleRowItem key={row.role.key} row={row} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-white/40">{t.adminNote}</p>
    </div>
  );
}

function AutoRolesAlert() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Alert variant="info">
      <SparklesIcon />
      <AlertTitle>{t.autoTitle}</AlertTitle>
      <AlertDescription className="max-w-2xl">
        <p>{t.autoText}</p>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await recalcRolesAction();
              if (!result.ok) return void toast.error(result.error);
              toast.success(t.recalcDone(result.changed));
              router.refresh();
            })
          }
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/15 px-3 text-xs font-semibold text-white no-underline transition hover:border-white/40 disabled:opacity-60"
        >
          {pending ? <Loader2Icon className="size-3.5 animate-spin" /> : <RefreshCwIcon className="size-3.5" />} {t.recalc}
        </button>
      </AlertDescription>
    </Alert>
  );
}

function RoleRowItem({ row: { role, users } }: { row: RoleRow }) {
  const { pending, run } = useRun();
  const [name, setName] = useState(role.name);
  const [color, setColor] = useState(role.color);
  const [threshold, setThreshold] = useState(toEuros(role.minSpendCents));
  const dirty = name !== role.name || color !== role.color || threshold !== toEuros(role.minSpendCents);
  const count = users ?? 0;

  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label={t.color}
            className="size-8 shrink-0 rounded-md border border-white/10 bg-transparent p-0.5"
          />
          <input value={name} onChange={(e) => setName(e.target.value)} aria-label={t.name} className={`${inputCls} max-w-52`} />
          {role.system && (
            <span className="inline-flex items-center gap-1 rounded border border-white/15 px-1.5 py-0.5 text-[10px] font-bold text-white/50 uppercase">
              <LockIcon className="size-3" /> {t.system}
            </span>
          )}
        </div>
        <span className="mt-1 block pl-11 font-mono text-[11px] text-white/35">{role.key}</span>
      </td>
      <td className="px-5 py-3">
        {role.system ? (
          <span className="text-xs text-white/40">{t.manual}</span>
        ) : (
          <div className="relative w-36">
            <input
              type="number"
              min="0"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder={t.thresholdPlaceholder}
              aria-label={t.thresholdLabel}
              title={t.thresholdHint}
              className={`${inputCls} pr-8`}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-white/40">€</span>
          </div>
        )}
      </td>
      <td className="px-5 py-3 text-sm">{count}</td>
      <td className="px-5 py-3">
        <div className="flex justify-end gap-2">
          {dirty && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => saveRoleAction({ key: role.key, name, color, minSpend: toMinSpend(threshold) }), t.saved)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-semibold text-white disabled:opacity-60"
            >
              {pending ? <Loader2Icon className="size-3.5 animate-spin" /> : <SaveIcon className="size-3.5" />} {admin.common.save}
            </button>
          )}
          {!role.system && (
            <button
              type="button"
              disabled={pending}
              aria-label={admin.common.delete}
              title={admin.common.delete}
              onClick={() => confirm(t.deleteConfirm(role.name, count)) && run(() => deleteRoleAction(role.key), t.deleted)}
              className="grid size-8 place-items-center rounded-md border border-white/10 text-white/60 transition hover:border-destructive/50 hover:text-destructive"
            >
              <Trash2Icon className="size-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function NewRoleForm() {
  const { pending, run } = useRun();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#22c55e");
  const [threshold, setThreshold] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveRoleAction({ name, color, minSpend: toMinSpend(threshold) }), t.created, () => {
          setName("");
          setThreshold("");
        });
      }}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4"
    >
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-white/80">{t.color}</span>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-10 rounded-md border border-white/10 bg-transparent p-0.5" />
      </label>
      <label className="grid min-w-56 flex-1 gap-1.5">
        <span className="text-xs font-semibold text-white/80">{t.name}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} className={inputCls} required minLength={2} maxLength={40} />
      </label>
      <label className="grid w-44 gap-1.5" title={t.thresholdHint}>
        <span className="text-xs font-semibold text-white/80">{t.thresholdLabel}</span>
        <input type="number" min="0" step="0.01" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder={t.thresholdPlaceholder} className={inputCls} />
      </label>
      <button type="submit" disabled={pending || name.trim().length < 2} className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50">
        {pending ? <Loader2Icon className="size-4 animate-spin" /> : <PlusIcon className="size-4" />} {t.create}
      </button>
      <p className="basis-full text-xs text-white/45">{t.thresholdHint}</p>
    </form>
  );
}
