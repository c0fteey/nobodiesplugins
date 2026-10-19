"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { eq } from "drizzle-orm";
import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";

export type ActionResult = { error: string } | undefined;

// Only allow same-site relative redirects after login
function safeRedirect(target: unknown) {
  return typeof target === "string" && target.startsWith("/") && !target.startsWith("//")
    ? target
    : "/dashboard";
}

export async function signInAction(input: unknown, callbackUrl?: string): Promise<ActionResult> {
  // Never trust the client: re-validate at runtime
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid sign-in details" };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeRedirect(callbackUrl),
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Wrong email or password" };
    throw error; // redirect after a successful sign-in
  }
}

export async function signUpAction(input: unknown): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const { email, password } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  });
  if (existing) return { error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(password, 12);
  const name = email.split("@")[0];
  await db.insert(users).values({ name, email, passwordHash });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created, but sign-in failed" };
    throw error;
  }
}

export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
