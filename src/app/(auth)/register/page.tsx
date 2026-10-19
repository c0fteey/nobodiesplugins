import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/auth-forms";
import { site } from "@/lang/site";

const t = site.auth.register;

export const metadata: Metadata = { title: site.meta.pages.register };

export default function RegisterPage() {
  return (
    <AuthLayout
      title={t.title}
      subtitle={t.subtitle}
      oauthLabel={t.oauthLabel}
      side={{ ...t.side, href: "/login" }}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
