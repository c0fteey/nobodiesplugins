import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, discordRoleRules, discordSettings, discordSyncLog, orderItems, orders } from "@/db/schema";

// One Discord application does both jobs: OAuth login (AUTH_DISCORD_ID/SECRET)
// and the bot that hands out roles (DISCORD_BOT_TOKEN). Discord requires the bot
// and the OAuth client to be the same app for "add user to server" to work.
const API = "https://discord.com/api/v10";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.AUTH_DISCORD_ID;
const CLIENT_SECRET = process.env.AUTH_DISCORD_SECRET;

export const discordLoginEnabled = !!CLIENT_ID && !!CLIENT_SECRET;
export const discordBotConfigured = !!BOT_TOKEN && discordLoginEnabled;

// Permission bit flags (Discord sends permissions as a BigInt string)
const NONE = BigInt(0);
const MANAGE_ROLES = BigInt(1) << BigInt(28);
const CREATE_INVITE = BigInt(1);
const ADMINISTRATOR = BigInt(1) << BigInt(3);

/** OAuth URL that adds the bot to a server with the permissions it needs. */
export const botInviteUrl = CLIENT_ID
  ? `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot&permissions=${MANAGE_ROLES | CREATE_INVITE}`
  : null;

class DiscordError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function api<T>(path: string, init: RequestInit = {}, auth = `Bot ${BOT_TOKEN}`): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: auth, "Content-Type": "application/json", ...init.headers },
      cache: "no-store",
    });
    // Rate limited: wait as told, once
    if (res.status === 429 && attempt === 0) {
      const body = (await res.json().catch(() => ({}))) as { retry_after?: number };
      await new Promise((r) => setTimeout(r, Math.min((body.retry_after ?? 1) * 1000, 10_000)));
      continue;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      throw new DiscordError(res.status, body.message ?? res.statusText);
    }
    return (res.status === 204 ? undefined : await res.json()) as T;
  }
}

type ApiRole = { id: string; name: string; color: number; position: number; managed: boolean; permissions: string };
type ApiMember = { roles: string[] };

export type GuildRole = { id: string; name: string; color: string; assignable: boolean };
export type GuildStatus =
  | { ok: true; guildName: string; roles: GuildRole[]; warnings: string[] }
  | { ok: false; error: string };

/** What the admin page needs: is the bot in the server, which roles exist, which can it hand out. */
export async function getGuildStatus(guildId: string): Promise<GuildStatus> {
  if (!discordBotConfigured) return { ok: false, error: "DISCORD_BOT_TOKEN / AUTH_DISCORD_ID / AUTH_DISCORD_SECRET are not set" };
  try {
    const [guild, roles, bot] = await Promise.all([
      api<{ name: string }>(`/guilds/${guildId}`),
      api<ApiRole[]>(`/guilds/${guildId}/roles`),
      api<{ id: string }>(`/users/@me`),
    ]);
    const botMember = await api<ApiMember>(`/guilds/${guildId}/members/${bot.id}`);
    const botRoles = roles.filter((r) => botMember.roles.includes(r.id) || r.id === guildId);
    const top = Math.max(...botRoles.map((r) => r.position));
    const perms = botRoles.reduce((acc, r) => acc | BigInt(r.permissions), NONE);
    const isAdmin = (perms & ADMINISTRATOR) !== NONE;

    const warnings: string[] = [];
    if (!isAdmin && !(perms & MANAGE_ROLES)) warnings.push("The bot is missing the Manage Roles permission.");
    if (!isAdmin && !(perms & CREATE_INVITE)) warnings.push("The bot is missing Create Invite, so it can't add members to the server.");

    return {
      ok: true,
      guildName: guild.name,
      warnings,
      roles: roles
        .filter((r) => r.id !== guildId) // @everyone
        .sort((a, b) => b.position - a.position)
        .map((r) => ({
          id: r.id,
          name: r.name,
          color: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : "#99aab5",
          // Bots can only manage roles below their own highest role, and never integration roles
          assignable: !r.managed && r.position < top,
        })),
    };
  } catch (error) {
    if (error instanceof DiscordError && (error.status === 403 || error.status === 404)) {
      return { ok: false, error: "The bot can't see this server. Invite it with the button below, then check the server ID." };
    }
    if (error instanceof DiscordError && error.status === 401) return { ok: false, error: "DISCORD_BOT_TOKEN is invalid." };
    return { ok: false, error: error instanceof Error ? error.message : "Discord request failed" };
  }
}

type DiscordAccount = typeof accounts.$inferSelect;

/** User OAuth token for "add to server"; refreshed and saved when it is about to expire. */
async function userAccessToken(account: DiscordAccount) {
  const now = Math.floor(Date.now() / 1000);
  if (account.access_token && (!account.expires_at || account.expires_at > now + 60)) return account.access_token;
  if (!account.refresh_token || !CLIENT_ID || !CLIENT_SECRET) return null;

  const res = await fetch(`${API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  if (!res.ok) return null;
  const token = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number; scope: string };
  await db
    .update(accounts)
    .set({ access_token: token.access_token, refresh_token: token.refresh_token, expires_at: now + token.expires_in, scope: token.scope })
    .where(and(eq(accounts.provider, "discord"), eq(accounts.providerAccountId, account.providerAccountId)));
  return token.access_token;
}

export type SyncResult = { ok: boolean; message: string };

/**
 * Makes the user's Discord roles match what they own: adds roles from matching
 * rules, joins them to the server if allowed, and (optionally) removes managed
 * roles they no longer qualify for. Roles not used by any rule are never touched.
 */
export async function syncDiscordMember(userId: string): Promise<SyncResult> {
  const config = await db.query.discordSettings.findFirst();
  if (!config?.enabled || !config.guildId || !discordBotConfigured) return { ok: false, message: "Discord sync is off" };
  const guildId = config.guildId;

  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.provider, "discord")),
  });
  if (!account) return { ok: false, message: "No Discord account linked" };
  const discordId = account.providerAccountId;

  try {
    const [rules, owned] = await Promise.all([
      db.select().from(discordRoleRules),
      db
        .selectDistinct({ productId: orderItems.productId })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(and(eq(orders.userId, userId), eq(orders.status, "completed"))),
    ]);
    const ownedIds = new Set(owned.map((o) => o.productId));
    const managed = new Set(rules.map((r) => r.roleId));
    const wanted = new Set(
      rules.filter((r) => (r.productId === null ? ownedIds.size > 0 : ownedIds.has(r.productId))).map((r) => r.roleId),
    );

    let member: ApiMember | null = null;
    try {
      member = await api<ApiMember>(`/guilds/${guildId}/members/${discordId}`);
    } catch (error) {
      if (!(error instanceof DiscordError && error.status === 404)) throw error;
    }

    if (!member) {
      if (!config.autoJoin) return done(userId, false, "Not in the Discord server yet");
      const token = await userAccessToken(account);
      if (!token) return done(userId, false, "Discord login expired; the user needs to reconnect Discord");
      await api(`/guilds/${guildId}/members/${discordId}`, {
        method: "PUT",
        body: JSON.stringify({ access_token: token, roles: [...wanted] }),
      });
      return done(userId, true, `Joined the server with ${wanted.size} role(s)`);
    }

    const toAdd = [...wanted].filter((r) => !member.roles.includes(r));
    const toRemove = config.removeRoles ? member.roles.filter((r) => managed.has(r) && !wanted.has(r)) : [];
    for (const roleId of toAdd) await api(`/guilds/${guildId}/members/${discordId}/roles/${roleId}`, { method: "PUT" });
    for (const roleId of toRemove) await api(`/guilds/${guildId}/members/${discordId}/roles/${roleId}`, { method: "DELETE" });

    if (!toAdd.length && !toRemove.length) return { ok: true, message: "Roles already up to date" };
    return done(userId, true, `Added ${toAdd.length}, removed ${toRemove.length} role(s)`);
  } catch (error) {
    const message =
      error instanceof DiscordError && error.status === 403
        ? "Missing permissions: move the bot's role above the roles it gives out"
        : error instanceof Error
          ? error.message
          : "Discord request failed";
    return done(userId, false, message);
  }
}

/** Logs the outcome for the admin page and returns it. */
async function done(userId: string, ok: boolean, message: string): Promise<SyncResult> {
  await db.insert(discordSyncLog).values({ userId, ok, message });
  return { ok, message };
}

/** Strips every rule-managed role from a Discord user (used when they unlink, so roles can't be farmed). */
export async function revokeManagedRoles(discordId: string) {
  const config = await db.query.discordSettings.findFirst();
  if (!config?.enabled || !config.guildId || !discordBotConfigured) return;
  const managed = new Set((await db.select({ roleId: discordRoleRules.roleId }).from(discordRoleRules)).map((r) => r.roleId));
  try {
    const member = await api<ApiMember>(`/guilds/${config.guildId}/members/${discordId}`);
    for (const roleId of member.roles.filter((r) => managed.has(r))) {
      await api(`/guilds/${config.guildId}/members/${discordId}/roles/${roleId}`, { method: "DELETE" });
    }
  } catch (error) {
    // Not in the server anymore: nothing to take back
    if (!(error instanceof DiscordError && error.status === 404)) console.error("Discord revoke failed", error);
  }
}

/** Everyone with a linked Discord account, one at a time to stay under rate limits. */
export async function syncAllDiscordMembers() {
  const linked = await db.select({ userId: accounts.userId }).from(accounts).where(eq(accounts.provider, "discord"));
  let ok = 0;
  for (const { userId } of linked) if ((await syncDiscordMember(userId)).ok) ok++;
  return { total: linked.length, ok };
}

/** Saves fresh OAuth tokens on every Discord sign-in (Auth.js only stores them on first link). */
export async function storeDiscordTokens(account: {
  providerAccountId: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
}) {
  if (!account.access_token) return;
  await db
    .update(accounts)
    .set({
      access_token: account.access_token,
      refresh_token: account.refresh_token ?? null,
      expires_at: account.expires_at ?? null,
      scope: account.scope ?? null,
    })
    .where(and(eq(accounts.provider, "discord"), eq(accounts.providerAccountId, account.providerAccountId)));
}

export async function getDiscordConfig() {
  return (
    (await db.query.discordSettings.findFirst()) ?? {
      id: "main",
      guildId: null,
      enabled: false,
      autoJoin: true,
      removeRoles: true,
      updatedAt: new Date(),
    }
  );
}
