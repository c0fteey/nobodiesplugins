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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { site } from "@/lang/site";
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validations/auth";

const t = site.auth;
const f = t.fields;

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
            aria-label={visible ? f.hidePassword : f.showPassword}
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
const OAUTH_ERRORS: Record<string, string> = t.oauthErrors;

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
        <Alert variant="destructive" className="mb-5">
          <CircleAlertIcon />
          <AlertDescription>{OAUTH_ERRORS[oauthError] ?? t.oauthErrors.fallback}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-4">
        <TextField
          id="email"
          label={f.email}
          icon={MailIcon}
          autoComplete="email"
          placeholder={f.emailPlaceholder}
          error={errors.email}
          registration={register("email")}
        />
        <TextField
          id="password"
          label={f.password}
          icon={LockIcon}
          password
          autoComplete="current-password"
          placeholder={f.passwordPlaceholder}
          error={errors.password}
          registration={register("password")}
          aside={
            <Link href="/help" className="text-xs text-white/50 transition hover:text-brand-soft">
              {t.login.forgot}
            </Link>
          }
        />
      </div>
      <label className="mt-4 flex w-fit cursor-pointer items-center gap-2.5 text-sm text-white/70 select-none">
        <input type="checkbox" {...register("remember")} /> {t.login.remember}
      </label>
      <SubmitButton pending={pending}>{t.login.submit}</SubmitButton>
    </form>
  );
}

const PASSWORD_RULES = [
  { label: site.auth.passwordRules.length, test: (v: string) => v.length >= 8 },
  { label: site.auth.passwordRules.letter, test: (v: string) => /[a-zA-Z]/.test(v) },
  { label: site.auth.passwordRules.number, test: (v: string) => /[0-9]/.test(v) },
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
          label={f.email}
          icon={MailIcon}
          autoComplete="email"
          placeholder={f.emailPlaceholder}
          error={errors.email}
          registration={register("email")}
        />
        <div>
          <TextField
            id="password"
            label={f.password}
            icon={LockIcon}
            password
            autoComplete="new-password"
            placeholder={f.newPasswordPlaceholder}
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
          label={f.confirmPassword}
          icon={LockIcon}
          password
          autoComplete="new-password"
          placeholder={f.confirmPlaceholder}
          error={errors.confirmPassword}
          registration={register("confirmPassword")}
        />
      </div>
      <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm text-white/70 select-none">
        <input type="checkbox" {...register("acceptTerms")} className="mt-0.5" />
        <span>
          {t.register.acceptBefore}
          <Link href="/help#terms" className="font-medium text-brand-soft hover:underline">
            {t.register.acceptLink}
          </Link>
        </span>
      </label>
      <ErrorText error={errors.acceptTerms as FieldError | undefined} />
      <SubmitButton pending={pending}>{t.register.submit}</SubmitButton>
    </form>
  );
}
