"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { CheckCircle2Icon, CircleAlertIcon, ExternalLinkIcon, InfoIcon, Loader2Icon, PlusIcon, RefreshCwIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Field, inputCls, Section, Toggle } from "./form-bits";
import { td, th } from "./ui";
import { admin } from "@/lang/admin";
import { site } from "@/lang/site";

const t = admin.discord;

type Config = { guildId: string; enabled: boolean; autoJoin: boolean; removeRoles: boolean };
type Rule = {
  id: string;
  roleId: string;
  productId: string | null;
  productName: string | null;
  siteRole: string | null;
  siteRoleName: string | null;
};
type SiteRole = { key: string; name: string; color: string };
type LogRow = { id: string; ok: boolean; message: string; createdAt: Date; email: string | null; discordUsername: string | null };

// Condition select values: "__any__", "role:<key>" or a product id
const EVERY_CUSTOMER = "__any__";
const ROLE_PREFIX = "role:";

export function DiscordAdmin({
  env,
  inviteUrl,
  config,
  guild,
  rules,
  products,
  siteRoles,
  log,
  linked,
}: {
  env: { login: boolean; bot: boolean };
  inviteUrl: string | null;
  config: Config;
  guild: GuildStatus | null;
  rules: Rule[];
  products: { id: string; name: string; type: string }[];
  siteRoles: SiteRole[];
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

      <Section title={t.rulesTitle}>
        <Alert variant="info">
          <InfoIcon />
          <AlertDescription>
            {t.rulesHint} <b className="text-white">{t.rulesHintEvery}</b>
            {t.rulesHintRest}
            {t.rulesHintRoles}
          </AlertDescription>
        </Alert>
        {!guild?.ok ? (
          <Alert>
            <CircleAlertIcon />
            <AlertDescription>{t.connectFirst}</AlertDescription>
          </Alert>
        ) : (
          <AddRuleForm
            roles={roles}
            products={products}
            siteRoles={siteRoles}
            pending={pending}
            onAdd={(v) => run(() => addDiscordRuleAction(v), t.ruleAdded)}
          />
        )}
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[520px]">
            <thead className="border-b border-white/5">
              <tr>
                <th className={th}>{t.columns.owns}</th>
                <th className={th}>{t.columns.gets}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const role = roleById.get(rule.roleId);
                return (
                  <tr key={rule.id} className="border-b border-white/5 last:border-0">
                    <td className={td}>
                      {rule.productId ? (
                        rule.productName
                      ) : rule.siteRole ? (
                        <span className="inline-flex items-center gap-2 font-semibold">
                          <span className="size-2 rounded-full" style={{ background: siteRoles.find((r) => r.key === rule.siteRole)?.color }} />
                          {t.siteRoleLabel(rule.siteRoleName ?? rule.siteRole)}
                        </span>
                      ) : (
                        <span className="font-semibold text-brand-soft">{t.everyCustomer}</span>
                      )}
                    </td>
                    <td className={td}>
                      {role ? (
                        <RoleChip role={role} />
                      ) : (
                        <span className="text-xs text-destructive">{t.deletedRole(rule.roleId)}</span>
                      )}
                    </td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        aria-label={t.deleteRule}
                        onClick={() => confirm(t.deleteRuleConfirm) && run(() => deleteDiscordRuleAction(rule.id), t.ruleDeleted)}
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
                  <td colSpan={3} className={`${td} text-white/50`}>{t.noRules}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={t.syncTitle}>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-white/70">
            {t.linked(linked)}
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await syncAllDiscordAction();
                if (!result.ok) return void toast.error(result.error);
                toast.success(t.synced(result.synced, result.total));
                router.refresh();
              })
            }
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />} {t.syncAll}
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[620px]">
            <thead className="border-b border-white/5">
              <tr>
                <th className={th}>{t.columns.time}</th>
                <th className={th}>{t.columns.user}</th>
                <th className={th}>{t.columns.result}</th>
              </tr>
            </thead>
            <tbody>
              {log.map((row) => (
                <tr key={row.id} className="border-b border-white/5 last:border-0">
                  <td className={`${td} whitespace-nowrap text-white/60`}>{formatDate(row.createdAt)} {new Date(row.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</td>
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
                  <td colSpan={3} className={`${td} text-white/50`}>{t.noLog}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {log.length > 0 && (
          <button type="button" onClick={() => run(clearDiscordLogAction, t.logCleared)} className="justify-self-start text-xs text-white/50 hover:text-white">
            {t.clearLog}
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
      toast.success(t.saved);
      router.refresh();
    });

  return (
    <Section title={t.setup}>
      <ul className="grid gap-2 text-sm">
        <Check ok={env.login} label={t.checks.login} hint={t.checks.loginHint} />
        <Check ok={env.bot} label={t.checks.bot} hint={t.checks.botHint} />
        <Check
          ok={!!guild?.ok}
          label={guild?.ok ? t.checks.connected(guild.guildName) : t.checks.inServer}
          hint={guild && !guild.ok ? guild.error : t.checks.inServerHint}
        />
      </ul>
      {guild?.ok &&
        guild.warnings.map((w) => (
          <Alert key={w} variant="warning">
            <TriangleAlertIcon />
            <AlertDescription>{w}</AlertDescription>
          </Alert>
        ))}
      {inviteUrl && (
        <a
          href={inviteUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 justify-self-start rounded-md bg-[#5865f2] px-4 text-sm font-semibold text-white hover:bg-[#4752c4]"
        >
          {t.invite} <ExternalLinkIcon className="size-4" />
        </a>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <Field label={t.serverId} hint={t.serverIdHint}>
          <input {...register("guildId")} placeholder="123456789012345678" inputMode="numeric" className={inputCls} />
        </Field>
        <div className="flex flex-wrap gap-6">
          <Toggle label={t.enable} {...register("enabled")} />
          <Toggle label={t.autoJoin} {...register("autoJoin")} />
          <Toggle label={t.removeRoles} {...register("removeRoles")} />
        </div>
        <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 justify-self-start rounded-md bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60">
          {saving && <Loader2Icon className="size-4 animate-spin" />} {t.save}
        </button>
      </form>
    </Section>
  );
}

function AddRuleForm({
  roles,
  products,
  siteRoles,
  pending,
  onAdd,
}: {
  roles: GuildRole[];
  products: { id: string; name: string; type: string }[];
  siteRoles: SiteRole[];
  pending: boolean;
  onAdd: (values: { productId: string | null; siteRole: string | null; roleId: string }) => void;
}) {
  const [condition, setCondition] = useState(EVERY_CUSTOMER);
  const [roleId, setRoleId] = useState("");

  return (
    <div className="grid items-end gap-3 rounded-lg border border-brand/30 bg-brand/5 p-4 md:grid-cols-[1fr_1fr_auto]">
      <Field label={t.whenOwns}>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} className={inputCls}>
          <optgroup label={t.groupGeneral}>
            <option value={EVERY_CUSTOMER}>{t.everyCustomerOption}</option>
          </optgroup>
          {siteRoles.length > 0 && (
            <optgroup label={t.groupSiteRoles}>
              {siteRoles.map((r) => (
                <option key={r.key} value={ROLE_PREFIX + r.key}>
                  {t.siteRoleOption(r.name)}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={t.groupProducts}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({site.productTypes[p.type as keyof typeof site.productTypes] ?? p.type})
              </option>
            ))}
          </optgroup>
        </select>
      </Field>
      <Field label={t.giveRole}>
        <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className={inputCls}>
          <option value="">{t.chooseRole}</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id} disabled={!r.assignable}>
              {r.name}
              {!r.assignable && t.aboveBot}
            </option>
          ))}
        </select>
      </Field>
      <button
        type="button"
        disabled={pending || !roleId}
        onClick={() =>
          onAdd({
            productId: condition === EVERY_CUSTOMER || condition.startsWith(ROLE_PREFIX) ? null : condition,
            siteRole: condition.startsWith(ROLE_PREFIX) ? condition.slice(ROLE_PREFIX.length) : null,
            roleId,
          })
        }
        className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        <PlusIcon className="size-4" /> {t.addRule}
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
