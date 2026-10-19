"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { signInAction, signUpAction } from "@/actions/auth";
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validations/auth";

const inputClass =
  "h-14 w-full rounded-md border border-white/20 bg-[#141414] px-4 text-[15px] outline-none transition placeholder:text-white/70 focus:border-brand aria-invalid:border-destructive";

function ErrorText({ error }: { error?: FieldError }) {
  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="pt-1.5 pl-1 text-xs text-destructive"
        >
          {error.message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      type="submit"
      disabled={pending}
      whileTap={{ scale: 0.98 }}
      className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand text-base font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand/85 disabled:opacity-70"
    >
      {pending && <Loader2Icon className="size-5 animate-spin" />}
      {children}
    </motion.button>
  );
}

// Auth.js sends OAuth failures back here as ?error=<code>
const OAUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "An account with this email already exists. Log in with your email and password, then connect Discord in Settings.",
  DiscordNoEmail: "Your Discord account has no verified email. Add one in Discord, then try again.",
  AccessDenied: "Sign-in was cancelled.",
};

export function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? undefined;
  const oauthError = params.get("error");
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = (values: SignInInput) =>
    startTransition(async () => {
      // Auth.js may hand us an absolute callback URL; keep only its path
      let target = callbackUrl;
      try {
        if (target) target = new URL(target, window.location.origin).pathname;
      } catch {
        target = undefined;
      }
      const result = await signInAction(values, target);
      if (result?.error) toast.error(result.error);
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {oauthError && (
        <p role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-white/90">
          {OAUTH_ERRORS[oauthError] ?? "Sign-in failed. Please try again."}
        </p>
      )}
      <div className="space-y-3">
        <div>
          <input {...register("email")} type="email" autoComplete="email" placeholder="Email" aria-label="Email" aria-invalid={!!errors.email} className={inputClass} />
          <ErrorText error={errors.email} />
        </div>
        <div>
          <input {...register("password")} type="password" autoComplete="current-password" placeholder="Password" aria-label="Password" aria-invalid={!!errors.password} className={inputClass} />
          <ErrorText error={errors.password} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register("remember")} className="size-3.5 accent-brand" /> Remember Me
        </label>
        <Link href="/help" className="text-xs text-white/70 hover:text-white">
          forgot my password
        </Link>
      </div>
      <SubmitButton pending={pending}>Login</SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = (values: SignUpInput) =>
    startTransition(async () => {
      const result = await signUpAction(values);
      if (result?.error) toast.error(result.error);
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-3">
        <div>
          <input {...register("email")} type="email" autoComplete="email" placeholder="Email" aria-label="Email" aria-invalid={!!errors.email} className={inputClass} />
          <ErrorText error={errors.email} />
        </div>
        <div>
          <input {...register("password")} type="password" autoComplete="new-password" placeholder="Password" aria-label="Password" aria-invalid={!!errors.password} className={inputClass} />
          <ErrorText error={errors.password} />
        </div>
        <div>
          <input {...register("confirmPassword")} type="password" autoComplete="new-password" placeholder="Password confirmation" aria-label="Password confirmation" aria-invalid={!!errors.confirmPassword} className={inputClass} />
          <ErrorText error={errors.confirmPassword} />
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("acceptTerms")} className="size-3.5 accent-brand" />
        I read and accept{" "}
        <Link href="/help#terms" className="text-brand-soft hover:underline">
          Terms & Conditions
        </Link>
      </label>
      <ErrorText error={errors.acceptTerms as FieldError | undefined} />
      <SubmitButton pending={pending}>Sign up</SubmitButton>
    </form>
  );
}
