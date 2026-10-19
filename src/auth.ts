import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import { after } from "next/server";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { signInSchema } from "@/lib/validations/auth";
import { discordLoginEnabled, storeDiscordTokens, syncDiscordMember } from "@/lib/discord";
import { authConfig } from "./auth.config";

const providers: Provider[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      const parsed = signInSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const user = await db.query.users.findFirst({
        where: eq(users.email, parsed.data.email),
      });
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role };
    },
  }),
];

// Google sign-in turns on once AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET are set
export const googleEnabled = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;
if (googleEnabled) providers.push(Google);

// Discord sign-in / account linking turns on once AUTH_DISCORD_ID / AUTH_DISCORD_SECRET are set.
// guilds.join lets the bot add buyers to the server with their roles.
if (discordLoginEnabled) {
  providers.push(
    Discord({
      authorization: { params: { scope: "identify email guilds.join" } },
      // Profile photos are still images: animated Discord avatars are taken as PNG
      profile(p) {
        const image = p.avatar
          ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${(BigInt(p.id) >> BigInt(22)) % BigInt(6)}.png`;
        return { id: p.id, name: p.global_name ?? p.username, email: p.email, image };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    signIn({ account, profile }) {
      // The user table needs an email; Discord accounts without one can't sign up
      if (account?.provider === "discord" && !profile?.email) return "/login?error=DiscordNoEmail";
      return true;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "discord" || !user.id) return;
      const userId = user.id;
      const p = profile as { username?: string; global_name?: string | null } | undefined;
      await db.update(users).set({ discordUsername: p?.global_name || p?.username || null }).where(eq(users.id, userId));
      await storeDiscordTokens(account);
      // Give roles for anything already owned, without slowing down the redirect
      after(() => syncDiscordMember(userId));
    },
  },
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
});
