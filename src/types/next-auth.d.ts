import type { DefaultSession } from "next-auth";

// Role keys live in the "role" table ("user", "admin", "customer", …)
type Role = string;

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
  }
}
