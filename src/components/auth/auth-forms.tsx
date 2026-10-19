"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch, type FieldError, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, CircleAlertIcon, EyeIcon, EyeOffIcon, Loader2Icon, LockIcon, MailIcon, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { signInAction, signUpAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validations/auth";

const inputClass =
  "peer h-12 w-full rounded-lg border border-white/10 bg-white/[0.03] pr-11 pl-10 text-[15px] outline-none transition placeholder:text-white/30 hover:border-white/20 focus:border-brand focus:bg-white/[0.05] focus:ring-4 focus:ring-brand/15 aria-invalid:border-destructive/70 aria-invalid:ring-destructive/10";

function ErrorText({ error }: { error?: FieldError }) {
  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="pt-1.5 text-xs text-destructive"
        >
          {error.message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function TextField({
  id,
  label,
  icon: Icon,
  error,
  aside,
  password,
  registration,
  ...input
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: FieldError;
  /** Rendered at the right end of the label row, e.g. "Forgot password?" */
  aside?: React.ReactNode;
  password?: boolean;
  registration: UseFormRegisterReturn;
} & Omit<React.ComponentProps<"input">, "id" | "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-white/85">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <input
          id={id}
          type={password ? (visible ? "text" : "password") : "email"}
          aria-invalid={!!error}
          className={inputClass}
          {...input}
          {...registration}
        />
        <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/35 transition peer-focus:text-brand-soft" />
        {password && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-white/40 transition hover:text-white"
          >
            {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        )}
      </div>
      <ErrorText error={error} />
    </div>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      type="submit"
      disabled={pending}
      whileTap={{ scale: 0.985 }}
      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_24px_-8px_rgb(91_43_255/0.6)] transition hover:bg-[#6a3dff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-70"
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
        <p role="alert" className="mb-5 flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-white/90">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
          {OAUTH_ERRORS[oauthError] ?? "Sign-in failed. Please try again."}
        </p>
      )}
      <div className="space-y-4">
        <TextField
          id="email"
          label="Email"
          icon={MailIcon}
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email}
          registration={register("email")}
        />
        <TextField
          id="password"
          label="Password"
          icon={LockIcon}
          password
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password}
          registration={register("password")}
          aside={
            <Link href="/help" className="text-xs text-white/50 transition hover:text-brand-soft">
              Forgot password?
            </Link>
          }
        />
      </div>
      <label className="mt-4 flex w-fit cursor-pointer items-center gap-2.5 text-sm text-white/70 select-none">
        <input type="checkbox" {...register("remember")} /> Remember me
      </label>
      <SubmitButton pending={pending}>Log in</SubmitButton>
    </form>
  );
}

const PASSWORD_RULES = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "A letter", test: (v: string) => /[a-zA-Z]/.test(v) },
  { label: "A number", test: (v: string) => /[0-9]/.test(v) },
];

export function RegisterForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = (values: SignUpInput) =>
    startTransition(async () => {
      const result = await signUpAction(values);
      if (result?.error) toast.error(result.error);
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-4">
        <TextField
          id="email"
          label="Email"
          icon={MailIcon}
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email}
          registration={register("email")}
        />
        <div>
          <TextField
            id="password"
            label="Password"
            icon={LockIcon}
            password
            autoComplete="new-password"
            placeholder="Create a password"
            error={errors.password}
            registration={register("password")}
          />
          {/* Live checklist so people know the rules before they hit submit */}
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li key={rule.label} className={cn("flex items-center gap-1.5 transition-colors", ok ? "text-success" : "text-white/40")}>
                  <CheckIcon className={cn("size-3.5 transition", ok ? "opacity-100" : "opacity-40")} />
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>
        <TextField
          id="confirmPassword"
          label="Confirm password"
          icon={LockIcon}
          password
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirmPassword}
          registration={register("confirmPassword")}
        />
      </div>
      <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm text-white/70 select-none">
        <input type="checkbox" {...register("acceptTerms")} className="mt-0.5" />
        <span>
          I read and accept the{" "}
          <Link href="/help#terms" className="font-medium text-brand-soft hover:underline">
            Terms & Conditions
          </Link>
        </span>
      </label>
      <ErrorText error={errors.acceptTerms as FieldError | undefined} />
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  );
}
