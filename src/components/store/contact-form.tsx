"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { sendContactAction } from "@/actions/store";
import { contactSchema, type ContactInput } from "@/lib/validations/store";
import { cn } from "@/lib/utils";
import { ChoiceSelect } from "@/components/ui/choice-select";

const SUBJECTS = (["Technical Support", "Billing", "Feature Request", "Other"] as const).map((s) => ({ value: s, label: s }));

const fieldClass =
  "w-full rounded-md bg-[#1c1c1e] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition placeholder:text-white/40 focus:ring-brand aria-invalid:ring-destructive";

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "Technical Support", message: "" },
  });

  const onSubmit = (values: ContactInput) =>
    startTransition(async () => {
      const result = await sendContactAction(values);
      if (!result.ok) return void toast.error(result.error);
      toast.success("Message sent — we'll get back to you soon");
      reset();
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      <Field label="Your Name" error={errors.name?.message}>
        <input {...register("name")} placeholder="Your Name" className={fieldClass} aria-invalid={!!errors.name} />
      </Field>
      <Field label="Your Email" required error={errors.email?.message}>
        <input {...register("email")} type="email" placeholder="you@example.com" className={fieldClass} aria-invalid={!!errors.email} />
      </Field>
      <Field label="Subject" required error={errors.subject?.message}>
        <Controller
          control={control}
          name="subject"
          render={({ field }) => (
            <ChoiceSelect
              value={field.value}
              onChange={field.onChange}
              options={SUBJECTS}
              aria-invalid={!!errors.subject}
              className={cn(fieldClass, "border-0 dark:bg-[#1c1c1e] dark:hover:bg-[#232326]")}
            />
          )}
        />
      </Field>
      <Field label="Message" required error={errors.message?.message}>
        <textarea {...register("message")} rows={5} className={cn(fieldClass, "resize-y")} aria-invalid={!!errors.message} />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-12 w-52 items-center justify-center gap-2 rounded-full bg-brand font-medium text-white transition hover:bg-brand/85 disabled:opacity-60"
      >
        {pending && <Loader2Icon className="size-4 animate-spin" />}
        Send Message
      </button>
    </form>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="pl-1 text-sm font-semibold">
        {required && <span className="text-brand-soft">* </span>}
        {label}
      </span>
      {children}
      {error && <span className="pl-1 text-xs text-destructive">{error}</span>}
    </label>
  );
}
