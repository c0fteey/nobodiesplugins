import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/auth-forms";
import { site } from "@/lang/site";

const t = site.auth.login;

export const metadata: Metadata = { title: site.meta.pages.login };

export default function LoginPage() {
  return (
    <AuthLayout
      title={t.title}
      subtitle={t.subtitle}
      oauthLabel={t.oauthLabel}
      side={{ ...t.side, href: "/register" }}
    >
      {/* Reads ?callbackUrl= */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
