"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon, EyeIcon, EyeOffIcon, Loader2Icon, PlusIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { DiscordIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from "@/components/brand/icons";
import { toast } from "sonner";
import type { SiteSettings } from "@/db/schema";
import { saveSettingsAction } from "@/actions/admin";
import { settingsSchema } from "@/lib/validations/store";
import { Field, inputCls, Section, Toggle } from "./form-bits";
import { admin } from "@/lang/admin";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const t = admin.settings;

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
  const { fields: navFields, move: moveNav, append: appendNav, remove: removeNav } = useFieldArray({ control, name: "navItems" });
  const navItems = useWatch({ control, name: "navItems" }) ?? [];

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        start(async () => {
          const result = await saveSettingsAction(values);
          if (!result.ok) return void toast.error(result.error);
          toast.success(t.saved);
          router.refresh();
        }),
      )}
      className="grid max-w-3xl gap-6"
    >
      <Section title={t.banners(fields.length)}>
        <p className="-mt-3 text-xs text-white/50">
          {t.bannersHint}
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
                    <p className="text-sm font-bold text-[#b9a6ff]">{b.title || t.bannerTitle}</p>
                    <p className="flex items-center gap-2 text-xs font-semibold">
                      {b.badge && <span className="rounded-full bg-brand px-2 py-0.5">{b.badge}</span>} {b.text}
                    </p>
                  </div>
                  {b.cta && <span className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold">{b.cta} →</span>}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Field label={t.bannerTitle} error={e?.title?.message}>
                    <input {...register(`announcements.${i}.title`)} className={inputCls} />
                  </Field>
                  <Field label={t.bannerBadge} error={e?.badge?.message}>
                    <input {...register(`announcements.${i}.badge`)} className={inputCls} />
                  </Field>
                  <Field label={t.bannerText} error={e?.text?.message}>
                    <input {...register(`announcements.${i}.text`)} className={inputCls} />
                  </Field>
                  <Field label={t.bannerCta} error={e?.cta?.message}>
                    <input {...register(`announcements.${i}.cta`)} className={inputCls} />
                  </Field>
                  <Field label={t.bannerHref} hint={t.bannerHrefHint} error={e?.href?.message}>
                    <input {...register(`announcements.${i}.href`)} className={inputCls} />
                  </Field>
                  <div className="flex items-end justify-between gap-2 pb-1">
                    <Toggle label={admin.common.enabled} control={control} name={`announcements.${i}.enabled` as const} />
                    <span className="flex gap-1">
                      <IconBtn label={admin.common.moveUp} disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUpIcon className="size-4" /></IconBtn>
                      <IconBtn label={admin.common.moveDown} disabled={i === fields.length - 1} onClick={() => move(i, i + 1)}><ArrowDownIcon className="size-4" /></IconBtn>
                      <IconBtn label={admin.common.remove} danger onClick={() => remove(i)}><Trash2Icon className="size-4" /></IconBtn>
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
            onClick={() => append({ enabled: true, title: t.newBanner.title, badge: "", text: "", cta: t.newBanner.cta, href: "/products" })}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-dashed border-white/20 px-4 text-sm font-semibold text-white/80 transition hover:border-brand hover:text-white"
          >
            <PlusIcon className="size-4" /> {t.addBanner}
          </button>
        )}
      </Section>

      <Section title={t.season}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={t.seasonLabel} hint={t.seasonLabelHint} error={errors.seasonLabel?.message}>
            <input {...register("seasonLabel")} className={inputCls} />
          </Field>
          <Field label={t.supportEmail} error={errors.supportEmail?.message}>
            <input {...register("supportEmail")} className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title={t.socials}>
        <p className="-mt-3 text-xs text-white/50">{t.socialsHint}</p>
        <div className="grid grid-cols-1 gap-3">
          <SocialRow
            control={control}
            icon={<DiscordIcon className="size-5" />}
            label={t.discordUrl}
            urlName="discordUrl"
            toggleName="footer.showDiscord"
            error={errors.discordUrl?.message}
            input={<input {...register("discordUrl")} placeholder="https://discord.gg/…" className={inputCls} />}
          />
          <SocialRow
            control={control}
            icon={<TwitterIcon className="size-5" />}
            label={t.twitterUrl}
            urlName="socials.twitter"
            toggleName="footer.showTwitter"
            error={errors.socials?.twitter?.message}
            input={<input {...register("socials.twitter")} placeholder="https://x.com/…" className={inputCls} />}
          />
          <SocialRow
            control={control}
            icon={<InstagramIcon className="size-5" />}
            label={t.instagramUrl}
            urlName="socials.instagram"
            toggleName="footer.showInstagram"
            error={errors.socials?.instagram?.message}
            input={<input {...register("socials.instagram")} placeholder="https://instagram.com/…" className={inputCls} />}
          />
          <SocialRow
            control={control}
            icon={<YoutubeIcon className="size-5" />}
            label={t.youtubeUrl}
            urlName="socials.youtube"
            error={errors.socials?.youtube?.message}
            note={t.youtubeNote}
            input={<input {...register("socials.youtube")} placeholder="https://youtube.com/@…" className={inputCls} />}
          />
        </div>
      </Section>

      <Section title={t.navigation}>
        <p className="-mt-3 text-xs text-white/50">
          {t.navigationHint}
        </p>
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {navFields.map((field, i) => {
              const item = navItems[i] ?? field;
              const e = errors.navItems?.[i];
              return (
                <motion.div
                  key={field.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`grid items-start gap-2 rounded-lg border border-white/10 bg-[#121212] p-3 sm:grid-cols-[1fr_1fr_auto] ${item.visible ? "" : "opacity-60"}`}
                >
                  <Field label={t.navLabel} error={e?.label?.message}>
                    <input {...register(`navItems.${i}.label`)} className={inputCls} aria-invalid={!!e?.label} />
                  </Field>
                  <Field
                    label={t.navHref}
                    hint={item.href === "/products" ? t.navMegaMenu : t.navHrefHint}
                    error={e?.href?.message}
                  >
                    <input {...register(`navItems.${i}.href`)} className={`${inputCls} font-mono text-xs`} aria-invalid={!!e?.href} />
                  </Field>
                  <div className="flex items-center gap-1 sm:pt-[22px]">
                    <label
                      title={item.visible ? t.navVisible : t.navHidden}
                      className="grid size-8 cursor-pointer place-items-center rounded-md border border-white/10 text-white/60 transition hover:text-white"
                    >
                      <input type="checkbox" className="sr-only" {...register(`navItems.${i}.visible`)} />
                      {item.visible ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4 opacity-40" />}
                    </label>
                    <IconBtn label={admin.common.moveUp} disabled={i === 0} onClick={() => moveNav(i, i - 1)}>
                      <ArrowUpIcon className="size-4" />
                    </IconBtn>
                    <IconBtn label={admin.common.moveDown} disabled={i === navFields.length - 1} onClick={() => moveNav(i, i + 1)}>
                      <ArrowDownIcon className="size-4" />
                    </IconBtn>
                    <IconBtn label={admin.common.remove} danger disabled={navFields.length <= 1} onClick={() => removeNav(i)}>
                      <Trash2Icon className="size-4" />
                    </IconBtn>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {navFields.length < 20 && (
          <button
            type="button"
            onClick={() => appendNav({ ...t.newNav, visible: true })}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-dashed border-white/20 px-4 text-sm font-semibold text-white/80 transition hover:border-brand hover:text-white"
          >
            <PlusIcon className="size-4" /> {t.addNav}
          </button>
        )}
      </Section>

      <Section title={t.footer}>
        <div className="grid grid-cols-1 gap-4">
          <Field label={t.tagline} hint={t.taglineHint} error={errors.footer?.tagline?.message}>
            <input {...register("footer.tagline")} className={inputCls} placeholder={t.taglinePlaceholder} />
          </Field>
        </div>
      </Section>

      <button type="submit" disabled={pending} className="flex h-11 w-48 items-center justify-center gap-2 rounded-md bg-brand font-semibold text-white transition hover:bg-brand/85 disabled:opacity-60">
        {pending && <Loader2Icon className="size-4 animate-spin" />} {t.save}
      </button>
    </form>
  );
}

type SocialUrl = "discordUrl" | "socials.twitter" | "socials.instagram" | "socials.youtube";
type SocialToggle = "footer.showDiscord" | "footer.showTwitter" | "footer.showInstagram";

/** One network: its link, whether the footer shows it, and a warning when it's on but has no link. */
function SocialRow({
  control,
  icon,
  label,
  urlName,
  toggleName,
  error,
  note,
  input,
}: {
  control: Control<FormIn>;
  icon: React.ReactNode;
  label: string;
  urlName: SocialUrl;
  toggleName?: SocialToggle;
  error?: string;
  note?: string;
  input: React.ReactNode;
}) {
  const url = (useWatch({ control, name: urlName }) as string | undefined) ?? "";
  const shown = useWatch({ control, name: toggleName ?? "footer.showDiscord" }) as boolean | undefined;
  const missing = !!toggleName && !!shown && !url.trim();

  return (
    <div className="grid items-center gap-3 rounded-lg border border-white/10 bg-[#121212] p-3 md:grid-cols-[auto_1fr_auto]">
      <span className={`grid size-10 place-items-center rounded-md ${url.trim() ? "bg-brand/20 text-brand-soft" : "bg-white/5 text-white/35"}`}>{icon}</span>
      <Field label={label} error={error} hint={missing ? undefined : note}>
        {input}
        {missing && (
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-amber-400">
            <TriangleAlertIcon className="size-3.5" /> {t.socialMissing}
          </span>
        )}
      </Field>
      {toggleName ? <Toggle label={t.showInFooter} control={control} name={toggleName} /> : <span />}
    </div>
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
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={`grid size-8 place-items-center rounded-md border border-white/10 transition disabled:opacity-30 ${danger ? "text-white/60 hover:border-destructive/50 hover:text-destructive" : "text-white/60 hover:text-white"}`}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
