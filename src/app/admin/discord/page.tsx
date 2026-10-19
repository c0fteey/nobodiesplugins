import type { Metadata } from "next";
import { getAllProducts, getDiscordLinkedCount, getDiscordLog, getDiscordRules } from "@/lib/data/admin";
import { botInviteUrl, discordBotConfigured, discordLoginEnabled, getDiscordConfig, getGuildStatus } from "@/lib/discord";
import { AdminHeader } from "@/components/admin/ui";
import { DiscordAdmin } from "@/components/admin/discord-admin";
import { admin } from "@/lang/admin";
import { getRoles } from "@/lib/data/roles";

export const metadata: Metadata = { title: admin.meta.discord + admin.meta.suffix };

export default async function AdminDiscordPage() {
  const [config, rules, products, log, linked, roles] = await Promise.all([
    getDiscordConfig(),
    getDiscordRules(),
    getAllProducts(),
    getDiscordLog(),
    getDiscordLinkedCount(),
    getRoles(),
  ]);
  // Live from Discord: server name, roles and whether the bot can give them
  const guild = config.guildId ? await getGuildStatus(config.guildId) : null;
  // "Kullanıcı" is everyone, so it makes no sense as a rule condition
  const conditionRoles = roles.filter((r) => r.key !== "user").map((r) => ({ key: r.key, name: r.name, color: r.color }));

  return (
    <>
      <AdminHeader title={admin.discord.title} description={admin.discord.description} />
      <DiscordAdmin
        env={{ login: discordLoginEnabled, bot: discordBotConfigured }}
        inviteUrl={botInviteUrl}
        config={{ guildId: config.guildId ?? "", enabled: config.enabled, autoJoin: config.autoJoin, removeRoles: config.removeRoles }}
        guild={guild}
        rules={rules}
        products={products.map((p) => ({ id: p.id, name: p.name, type: p.type }))}
        siteRoles={conditionRoles}
        log={log}
        linked={linked}
      />
    </>
  );
}
