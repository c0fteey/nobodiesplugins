import type { Metadata } from "next";
import { getAllProducts, getDiscordLinkedCount, getDiscordLog, getDiscordRules } from "@/lib/data/admin";
import { botInviteUrl, discordBotConfigured, discordLoginEnabled, getDiscordConfig, getGuildStatus } from "@/lib/discord";
import { AdminHeader } from "@/components/admin/ui";
import { DiscordAdmin } from "@/components/admin/discord-admin";

export const metadata: Metadata = { title: "Discord · Admin" };

export default async function AdminDiscordPage() {
  const [config, rules, products, log, linked] = await Promise.all([
    getDiscordConfig(),
    getDiscordRules(),
    getAllProducts(),
    getDiscordLog(),
    getDiscordLinkedCount(),
  ]);
  // Live from Discord: server name, roles and whether the bot can give them
  const guild = config.guildId ? await getGuildStatus(config.guildId) : null;

  return (
    <>
      <AdminHeader title="Discord" description="Discord login, and roles that buyers get automatically." />
      <DiscordAdmin
        env={{ login: discordLoginEnabled, bot: discordBotConfigured }}
        inviteUrl={botInviteUrl}
        config={{ guildId: config.guildId ?? "", enabled: config.enabled, autoJoin: config.autoJoin, removeRoles: config.removeRoles }}
        guild={guild}
        rules={rules}
        products={products.map((p) => ({ id: p.id, name: p.name, type: p.type }))}
        log={log}
        linked={linked}
      />
    </>
  );
}
