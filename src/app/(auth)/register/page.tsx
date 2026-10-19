import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <AuthLayout
      heading={
        <>
          Welcome!
          <br />
          Please sign up now
        </>
      }
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
