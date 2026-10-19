import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/auth-forms";
import { site } from "@/lang/site";

const t = site.auth.register;

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("register");
}

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
