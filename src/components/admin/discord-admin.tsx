"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { CheckCircle2Icon, CircleAlertIcon, ExternalLinkIcon, Loader2Icon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { AdminResult } from "@/actions/admin";
import {
  addDiscordRuleAction,
  clearDiscordLogAction,
  deleteDiscordRuleAction,
  saveDiscordSettingsAction,
  syncAllDiscordAction,
} from "@/actions/discord-admin";
import type { GuildRole, GuildStatus } from "@/lib/discord";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Field, inputCls, Section, Toggle } from "./form-bits";
import { td, th } from "./ui";

type Config = { guildId: string; enabled: boolean; autoJoin: boolean; removeRoles: boolean };
type Rule = { id: string; roleId: string; productId: string | null; productName: string | null };
type LogRow = { id: string; ok: boolean; message: string; createdAt: Date; email: string | null; discordUsername: string | null };

const EVERY_CUSTOMER = "__any__";

export function DiscordAdmin({
  env,
  inviteUrl,
  config,
  guild,
  rules,
  products,
  log,
  linked,
}: {
  env: { login: boolean; bot: boolean };
  inviteUrl: string | null;
  config: Config;
  guild: GuildStatus | null;
  rules: Rule[];
  products: { id: string; name: string; type: string }[];
  log: LogRow[];
  linked: number;
}) {
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

  const roles = guild?.ok ? guild.roles : [];
  const roleById = new Map(roles.map((r) => [r.id, r]));

  return (
    <div className="grid gap-6">
      <SetupSection env={env} inviteUrl={inviteUrl} config={config} guild={guild} />

      <Section title="Role rules">
        <p className="-mt-2 text-sm text-white/60">
          Buyers get every role whose product they own. <b className="text-white/80">Every customer</b> rules apply to anyone who owns at least one product.
        </p>
        {!guild?.ok ? (
          <p className="rounded-lg border border-dashed border-white/15 p-6 text-center text-sm text-white/50">
            Connect the bot to a server above to pick roles.
          </p>
        ) : (
          <AddRuleForm roles={roles} products={products} pending={pending} onAdd={(v) => run(() => addDiscordRuleAction(v), "Rule added")} />
        )}
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[520px]">
            <thead className="border-b border-white/5">
              <tr>
                <th className={th}>WHEN THE USER OWNS</th>
                <th className={th}>THEY GET</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const role = roleById.get(rule.roleId);
                return (
                  <tr key={rule.id} className="border-b border-white/5 last:border-0">
                    <td className={td}>{rule.productId ? rule.productName : <span className="font-semibold text-brand-soft">Every customer</span>}</td>
                    <td className={td}>
                      {role ? (
                        <RoleChip role={role} />
                      ) : (
                        <span className="text-xs text-destructive">Deleted role ({rule.roleId})</span>
                      )}
                    </td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        aria-label="Delete rule"
                        onClick={() => confirm("Delete this rule? Existing members keep the role until the next sync.") && run(() => deleteDiscordRuleAction(rule.id), "Rule deleted")}
                        className="text-white/50 hover:text-destructive"
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={3} className={`${td} text-white/50`}>No rules yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Sync">
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-white/70">
            <b className="text-white">{linked}</b> user{linked === 1 ? " has" : "s have"} linked Discord. Roles sync automatically after each purchase and when someone links Discord.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await syncAllDiscordAction();
                if (!result.ok) return void toast.error(result.error);
                toast.success(`Synced ${result.synced} of ${result.total} users`);
                router.refresh();
              })
            }
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />} Sync everyone now
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[620px]">
            <thead className="border-b border-white/5">
              <tr>
                <th className={th}>TIME</th>
                <th className={th}>USER</th>
                <th className={th}>RESULT</th>
              </tr>
            </thead>
            <tbody>
              {log.map((row) => (
                <tr key={row.id} className="border-b border-white/5 last:border-0">
                  <td className={`${td} whitespace-nowrap text-white/60`}>{formatDate(row.createdAt)} {new Date(row.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className={td}>
                    <span className="block">{row.email ?? "—"}</span>
                    {row.discordUsername && <span className="text-xs text-white/50">{row.discordUsername}</span>}
                  </td>
                  <td className={td}>
                    <span className={cn("inline-flex items-center gap-1.5", row.ok ? "text-success" : "text-destructive")}>
                      {row.ok ? <CheckCircle2Icon className="size-4 shrink-0" /> : <CircleAlertIcon className="size-4 shrink-0" />}
                      {row.message}
                    </span>
                  </td>
                </tr>
              ))}
              {log.length === 0 && (
                <tr>
                  <td colSpan={3} className={`${td} text-white/50`}>Nothing synced yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {log.length > 0 && (
          <button type="button" onClick={() => run(clearDiscordLogAction, "Log cleared")} className="justify-self-start text-xs text-white/50 hover:text-white">
            Clear log
          </button>
        )}
      </Section>
    </div>
  );
}

function SetupSection({
  env,
  inviteUrl,
  config,
  guild,
}: {
  env: { login: boolean; bot: boolean };
  inviteUrl: string | null;
  config: Config;
  guild: GuildStatus | null;
}) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const { register, handleSubmit } = useForm<Config>({ defaultValues: config });

  const onSubmit = (values: Config) =>
    startSave(async () => {
      const result = await saveDiscordSettingsAction(values);
      if (!result.ok) return void toast.error(result.error);
      toast.success("Discord settings saved");
      router.refresh();
    });

  return (
    <Section title="Setup">
      <ul className="grid gap-2 text-sm">
        <Check ok={env.login} label="Discord login" hint="AUTH_DISCORD_ID and AUTH_DISCORD_SECRET in .env.local" />
        <Check ok={env.bot} label="Bot token" hint="DISCORD_BOT_TOKEN in .env.local (same Discord application)" />
        <Check
          ok={!!guild?.ok}
          label={guild?.ok ? `Connected to ${guild.guildName}` : "Bot in your server"}
          hint={guild && !guild.ok ? guild.error : "Invite the bot, then paste your server ID below"}
        />
      </ul>
      {guild?.ok &&
        guild.warnings.map((w) => (
          <p key={w} className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">{w}</p>
        ))}
      {inviteUrl && (
        <a
          href={inviteUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 justify-self-start rounded-md bg-[#5865f2] px-4 text-sm font-semibold text-white hover:bg-[#4752c4]"
        >
          Invite the bot to your server <ExternalLinkIcon className="size-4" />
        </a>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <Field label="Server ID" hint="Discord: Settings → Advanced → Developer Mode, then right-click your server → Copy Server ID">
          <input {...register("guildId")} placeholder="123456789012345678" inputMode="numeric" className={inputCls} />
        </Field>
        <div className="flex flex-wrap gap-6">
          <Toggle label="Enable role sync" {...register("enabled")} />
          <Toggle label="Add buyers to the server automatically" {...register("autoJoin")} />
          <Toggle label="Remove roles after a refund or disconnect" {...register("removeRoles")} />
        </div>
        <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 justify-self-start rounded-md bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60">
          {saving && <Loader2Icon className="size-4 animate-spin" />} Save settings
        </button>
      </form>
    </Section>
  );
}

function AddRuleForm({
  roles,
  products,
  pending,
  onAdd,
}: {
  roles: GuildRole[];
  products: { id: string; name: string; type: string }[];
  pending: boolean;
  onAdd: (values: { productId: string | null; roleId: string }) => void;
}) {
  const [productId, setProductId] = useState(EVERY_CUSTOMER);
  const [roleId, setRoleId] = useState("");

  return (
    <div className="grid items-end gap-3 rounded-lg border border-brand/30 bg-brand/5 p-4 md:grid-cols-[1fr_1fr_auto]">
      <Field label="When the user owns">
        <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls}>
          <option value={EVERY_CUSTOMER}>Every customer (any product)</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.type})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Give role">
        <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className={inputCls}>
          <option value="">Choose a role…</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id} disabled={!r.assignable}>
              {r.name}
              {!r.assignable && " (above the bot's role)"}
            </option>
          ))}
        </select>
      </Field>
      <button
        type="button"
        disabled={pending || !roleId}
        onClick={() => onAdd({ productId: productId === EVERY_CUSTOMER ? null : productId, roleId })}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        <PlusIcon className="size-4" /> Add rule
      </button>
    </div>
  );
}

function RoleChip({ role }: { role: GuildRole }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-2.5 py-0.5 text-sm">
      <span className="size-2.5 rounded-full" style={{ background: role.color }} />
      {role.name}
    </span>
  );
}

function Check({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" /> : <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-white/40" />}
      <span>
        <span className={ok ? "font-semibold" : "font-semibold text-white/70"}>{label}</span>
        {!ok && <span className="block text-xs text-white/50">{hint}</span>}
      </span>
    </li>
  );
}
