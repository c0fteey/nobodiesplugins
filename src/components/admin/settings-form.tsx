"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon, EyeIcon, EyeOffIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { SiteSettings } from "@/db/schema";
import { saveSettingsAction } from "@/actions/admin";
import { settingsSchema } from "@/lib/validations/store";
import { Field, inputCls, Section, Toggle } from "./form-bits";

type FormIn = z.input<typeof settingsSchema>;
type FormOut = z.output<typeof settingsSchema>;

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });
  const { fields, append, remove, move } = useFieldArray({ control, name: "announcements" });
  const banners = useWatch({ control, name: "announcements" }) ?? [];
  const { fields: navFields, move: moveNav } = useFieldArray({ control, name: "navItems" });
  const navItems = useWatch({ control, name: "navItems" }) ?? [];

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        start(async () => {
          const result = await saveSettingsAction(values);
          if (!result.ok) return void toast.error(result.error);
          toast.success("Settings saved");
          router.refresh();
        }),
      )}
      className="grid max-w-3xl gap-6"
    >
      <Section title={`Announcement banners (${fields.length})`}>
        <p className="-mt-3 text-xs text-white/50">
          Enabled banners rotate at the top of the store every 5 seconds, sliding from right to left.
        </p>
        <AnimatePresence initial={false}>
          {fields.map((field, i) => {
            const b = banners[i] ?? field;
            const e = errors.announcements?.[i];
            return (
              <motion.div
                key={field.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 rounded-xl border border-white/10 bg-[#121212] p-4"
              >
                {/* live preview */}
                <div className={`flex items-center justify-between rounded-lg bg-[linear-gradient(90deg,#2a1690,#3a20b8_45%,#2a1690)] px-5 py-3 ${b.enabled ? "" : "opacity-40"}`}>
                  <div>
                    <p className="text-sm font-bold text-[#b9a6ff]">{b.title || "Title"}</p>
                    <p className="flex items-center gap-2 text-xs font-semibold">
                      {b.badge && <span className="rounded-full bg-brand px-2 py-0.5">{b.badge}</span>} {b.text}
                    </p>
                  </div>
                  {b.cta && <span className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold">{b.cta} →</span>}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Title" error={e?.title?.message}>
                    <input {...register(`announcements.${i}.title`)} className={inputCls} />
                  </Field>
                  <Field label="Badge" error={e?.badge?.message}>
                    <input {...register(`announcements.${i}.badge`)} className={inputCls} />
                  </Field>
                  <Field label="Text" error={e?.text?.message}>
                    <input {...register(`announcements.${i}.text`)} className={inputCls} />
                  </Field>
                  <Field label="Button text" error={e?.cta?.message}>
                    <input {...register(`announcements.${i}.cta`)} className={inputCls} />
                  </Field>
                  <Field label="Button link" hint="/products or https://…" error={e?.href?.message}>
                    <input {...register(`announcements.${i}.href`)} className={inputCls} />
                  </Field>
                  <div className="flex items-end justify-between gap-2 pb-1">
                    <Toggle label="Enabled" {...register(`announcements.${i}.enabled`)} />
                    <span className="flex gap-1">
                      <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUpIcon className="size-4" /></IconBtn>
                      <IconBtn label="Move down" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)}><ArrowDownIcon className="size-4" /></IconBtn>
                      <IconBtn label="Remove" danger onClick={() => remove(i)}><Trash2Icon className="size-4" /></IconBtn>
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {fields.length < 10 && (
          <button
            type="button"
            onClick={() => append({ enabled: true, title: "NEW ANNOUNCEMENT", badge: "", text: "", cta: "SHOP NOW", href: "/products" })}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-dashed border-white/20 px-4 text-sm font-semibold text-white/80 transition hover:border-brand hover:text-white"
          >
            <PlusIcon className="size-4" /> Add banner
          </button>
        )}
      </Section>

      <Section title="Season & contact">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Season label" hint='Used in "Save €2 — Halloween Season offer"' error={errors.seasonLabel?.message}>
            <input {...register("seasonLabel")} className={inputCls} />
          </Field>
          <Field label="Discord invite URL" error={errors.discordUrl?.message}>
            <input {...register("discordUrl")} className={inputCls} />
          </Field>
          <Field label="Support email" error={errors.supportEmail?.message}>
            <input {...register("supportEmail")} className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="Navigation">
        <p className="-mt-3 text-xs text-white/50">
          Toggle visibility and reorder links shown in the site header. The Products item opens the plugin mega-menu.
        </p>
        <div className="space-y-2">
          {navFields.map((field, i) => {
            const item = navItems[i] ?? field;
            return (
              <motion.div
                key={field.id}
                layout
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#121212] px-4 py-3"
              >
                <span className={`size-2 rounded-full shrink-0 ${item.visible ? "bg-brand" : "bg-white/20"}`} />
                <span className="flex-1 text-sm font-medium">
                  {item.label}
                  <span className="ml-2 text-xs text-white/35">{item.href}</span>
                </span>
                <div className="flex items-center gap-1">
                  <IconBtn label="Move up" disabled={i === 0} onClick={() => moveNav(i, i - 1)}>
                    <ArrowUpIcon className="size-4" />
                  </IconBtn>
                  <IconBtn label="Move down" disabled={i === navFields.length - 1} onClick={() => moveNav(i, i + 1)}>
                    <ArrowDownIcon className="size-4" />
                  </IconBtn>
                  <label className="grid size-8 cursor-pointer place-items-center rounded-md border border-white/10 text-white/60 transition hover:text-white">
                    <input type="checkbox" className="sr-only" {...register(`navItems.${i}.visible`)} />
                    {item.visible ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4 opacity-40" />}
                  </label>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      <Section title="Footer">
        <div className="grid gap-4">
          <Field label="Tagline" hint="Short description shown under the logo" error={errors.footer?.tagline?.message}>
            <input {...register("footer.tagline")} className={inputCls} placeholder="Premium plugins for serious Minecraft servers." />
          </Field>
          <div className="flex flex-wrap gap-6">
            <Toggle label="Show Discord icon" {...register("footer.showDiscord")} />
            <Toggle label="Show Twitter icon" {...register("footer.showTwitter")} />
            <Toggle label="Show Instagram icon" {...register("footer.showInstagram")} />
          </div>
        </div>
      </Section>

      <button type="submit" disabled={pending} className="flex h-11 w-48 items-center justify-center gap-2 rounded-md bg-brand font-semibold text-white transition hover:bg-brand/85 disabled:opacity-60">
        {pending && <Loader2Icon className="size-4 animate-spin" />} Save settings
      </button>
    </form>
  );
}

export function IconBtn({
  label,
  danger,
  disabled,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-md border border-white/10 transition disabled:opacity-30 ${danger ? "text-white/60 hover:border-destructive/50 hover:text-destructive" : "text-white/60 hover:text-white"}`}
    >
      {children}
    </button>
  );
}
