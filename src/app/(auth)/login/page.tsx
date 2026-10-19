import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to download your plugins and manage your licenses."
      switchTo={{ prompt: "New here?", cta: "Create an account", href: "/register" }}
      oauthLabel="Login with"
      side={{
        title: "New here?",
        text: "Don't waste time! Create your account right now and enjoy the benefits of having an account.",
        cta: "Create an account",
        href: "/register",
      }}
    >
      {/* Reads ?callbackUrl= */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
