import "server-only";
import { connection } from "next/server";
import { auth } from "@/auth";

/**
 * Reads the Auth.js session at request time. `connection()` marks the caller as
 * dynamic first, since auth() touches crypto before reading cookies, which
 * Cache Components rejects during prerendering. Call it behind <Suspense>.
 */
export async function getSession() {
  await connection();
  return auth();
}
