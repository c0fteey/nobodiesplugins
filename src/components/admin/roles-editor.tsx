"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, LockIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@/db/schema";
import { deleteRoleAction, saveRoleAction, type AdminResult } from "@/actions/admin";
import { admin } from "@/lang/admin";
import { inputCls } from "./form-bits";

const t = admin.roles;

type RoleRow = { role: Role; users: number | null };

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
  return { pending, run };
}

export function RolesEditor({ rows }: { rows: RoleRow[] }) {
  return (
    <div className="space-y-6">
      <NewRoleForm />
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#171717]">
        <table className="w-full min-w-[620px]">
          <thead className="border-b border-white/5">
            <tr className="text-left text-[10px] font-bold tracking-[0.14em] text-white/50">
              <th className="px-5 py-3">{t.columns.role}</th>
              <th className="px-5 py-3">{t.columns.key}</th>
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

function RoleRowItem({ row: { role, users } }: { row: RoleRow }) {
  const { pending, run } = useRun();
  const [name, setName] = useState(role.name);
  const [color, setColor] = useState(role.color);
  const dirty = name !== role.name || color !== role.color;
  const count = users ?? 0;

  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label={admin.roles.color}
            className="size-8 shrink-0 rounded-md border border-white/10 bg-transparent p-0.5"
          />
          <input value={name} onChange={(e) => setName(e.target.value)} aria-label={t.name} className={`${inputCls} max-w-56`} />
          {role.system && (
            <span className="inline-flex items-center gap-1 rounded border border-white/15 px-1.5 py-0.5 text-[10px] font-bold text-white/50 uppercase">
              <LockIcon className="size-3" /> {t.system}
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-3 font-mono text-xs text-white/50">{role.key}</td>
      <td className="px-5 py-3 text-sm">{count}</td>
      <td className="px-5 py-3">
        <div className="flex justify-end gap-2">
          {dirty && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => saveRoleAction({ key: role.key, name, color }), t.saved)}
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveRoleAction({ name, color }), t.created, () => setName(""));
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
      <button type="submit" disabled={pending || name.trim().length < 2} className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50">
        {pending ? <Loader2Icon className="size-4 animate-spin" /> : <PlusIcon className="size-4" />} {t.create}
      </button>
    </form>
  );
}
