import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no DB imports) shared by the proxy and the full auth setup
export const authConfig = {
  // OAuth errors land on the login page as ?error=<code>
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user;
      const path = nextUrl.pathname;

      if (path.startsWith("/login") || path.startsWith("/register")) {
        if (!user) return true;
        // A signed-in user whose Discord link failed: show the reason in Settings
        const error = nextUrl.searchParams.get("error");
        const target = error ? `/dashboard/settings?discord=${encodeURIComponent(error)}` : "/dashboard";
        return Response.redirect(new URL(target, nextUrl));
      }
      if (path.startsWith("/admin")) {
        // Optimistic: the admin layout and every admin action re-check the role in the DB
        if (!user) return false;
        return user.role === "admin" ? true : Response.redirect(new URL("/dashboard", nextUrl));
      }
      // /dashboard and anything else matched requires a session
      return !!user;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role ?? "user";
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      session.user.role = (token.role as "user" | "admin" | undefined) ?? "user";
      return session;
    },
  },
} satisfies NextAuthConfig;
