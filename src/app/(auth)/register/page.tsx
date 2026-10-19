import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get instant access to your downloads, license keys and Discord roles."
      switchTo={{ prompt: "Already have an account?", cta: "Log in", href: "/login" }}
      oauthLabel="Sign up with"
      side={{
        title: "Already registered?",
        text: "Access your account and enjoy the benefits and discounts made for you.",
        cta: "Login",
        href: "/login",
      }}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
