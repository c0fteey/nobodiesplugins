import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/auth-forms";
import { site } from "@/lang/site";

const t = site.auth.login;

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("login");
}

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
