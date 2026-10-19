"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { GlobeIcon, ImageIcon, Loader2Icon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { saveSeoAction } from "@/actions/admin";
import { ImageUploadButton } from "@/components/media/image-upload";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { seoSchema } from "@/lib/validations/store";
import { SEO_PAGES, type SeoPageKey, type SeoSettings } from "@/lib/seo-pages";
import { cn } from "@/lib/utils";
import { admin } from "@/lang/admin";
import { Field, inputCls, Section, textareaCls, Toggle } from "./form-bits";

const t = admin.seo;
type FormIn = z.input<typeof seoSchema>;
type FormOut = z.output<typeof seoSchema>;

// What Google typically shows before cutting text off
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;
const PAGE_KEYS = Object.keys(SEO_PAGES) as SeoPageKey[];

export function SeoForm({ seo }: { seo: SeoSettings }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(seoSchema),
    defaultValues: seo,
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        start(async () => {
          const result = await saveSeoAction(values);
          if (!result.ok) return void toast.error(result.error);
          toast.success(t.saved);
          router.refresh();
        }),
      )}
      className="grid max-w-5xl gap-6"
    >
      <Section title={t.general}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={t.siteName} error={errors.siteName?.message}>
            <input {...register("siteName")} className={inputCls} />
          </Field>
          <Field label={t.siteUrl} hint={t.siteUrlHint} error={errors.siteUrl?.message}>
            <input {...register("siteUrl")} placeholder="https://…" className={inputCls} />
          </Field>
          <Field label={t.titleTemplate} hint={t.titleTemplateHint} error={errors.titleTemplate?.message}>
            <input {...register("titleTemplate")} className={inputCls} />
          </Field>
          <Field label={t.twitter} hint={t.twitterHint} error={errors.twitterHandle?.message}>
            <input {...register("twitterHandle")} placeholder="@" className={inputCls} />
          </Field>
        </div>
        <Field label={t.defaultDescription} hint={t.defaultDescriptionHint} error={errors.defaultDescription?.message}>
          <textarea {...register("defaultDescription")} rows={2} className={textareaCls} />
        </Field>
        <ImageField
          label={t.defaultImage}
          error={errors.defaultImage?.message}
          input={<input {...register("defaultImage")} placeholder="https://…" className={inputCls} />}
          onUploaded={(url) => setValue("defaultImage", url, { shouldDirty: true })}
        />
        <Toggle label={t.indexable} control={control} name="indexable" />
        <IndexableNote control={control} />
      </Section>

      <Section title={t.pages}>
        <p className="-mt-3 text-xs text-white/50">{t.pagesHint}</p>
        <Tabs defaultValue="home" className="gap-5">
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-white/[0.04] p-1">
            {PAGE_KEYS.map((key) => (
              <TabsTrigger key={key} value={key} className="h-8 flex-none px-3 data-active:bg-brand data-active:text-white">
                {t.pageNames[key]}
              </TabsTrigger>
            ))}
          </TabsList>
          {PAGE_KEYS.map((key) => (
            <TabsContent key={key} value={key}>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
                <div className="grid content-start gap-4">
                  <CountedField
                    control={control}
                    name={`pages.${key}.title`}
                    max={TITLE_MAX}
                    label={t.pageTitle}
                    hint={key === "home" ? t.pageTitleHintHome : undefined}
                    error={errors.pages?.[key]?.title?.message}
                    input={<input {...register(`pages.${key}.title`)} className={inputCls} />}
                  />
                  <CountedField
                    control={control}
                    name={`pages.${key}.description`}
                    max={DESCRIPTION_MAX}
                    label={t.pageDescription}
                    error={errors.pages?.[key]?.description?.message}
                    input={<textarea {...register(`pages.${key}.description`)} rows={3} placeholder={seo.defaultDescription} className={textareaCls} />}
                  />
                  <ImageField
                    label={t.pageImage}
                    error={errors.pages?.[key]?.image?.message}
                    input={<input {...register(`pages.${key}.image`)} placeholder="https://…" className={inputCls} />}
                    onUploaded={(url) => setValue(`pages.${key}.image`, url, { shouldDirty: true })}
                  />
                </div>
                <Previews control={control} pageKey={key} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Section>

      <button type="submit" disabled={pending} className="flex h-11 w-48 items-center justify-center gap-2 rounded-md bg-brand font-semibold text-white transition hover:bg-brand/85 disabled:opacity-60">
        {pending && <Loader2Icon className="size-4 animate-spin" />} {t.save}
      </button>
    </form>
  );
}

function IndexableNote({ control }: { control: Control<FormIn> }) {
  const indexable = useWatch({ control, name: "indexable" });
  if (indexable) return null;
  return (
    <Alert variant="warning">
      <SearchIcon />
      <AlertDescription>{t.indexableOff}</AlertDescription>
    </Alert>
  );
}

function ImageField({ label, error, input, onUploaded }: { label: string; error?: string; input: React.ReactNode; onUploaded: (url: string) => void }) {
  return (
    <Field label={label} hint={t.imageHint} error={error}>
      <div className="flex gap-2">
        {input}
        <ImageUploadButton kind="seo" onUploaded={onUploaded} />
      </div>
    </Field>
  );
}

/** Text field with a live "n / max characters" counter that turns amber past the recommended length. */
function CountedField({
  control,
  name,
  max,
  label,
  hint,
  error,
  input,
}: {
  control: Control<FormIn>;
  name: `pages.${SeoPageKey}.title` | `pages.${SeoPageKey}.description`;
  max: number;
  label: string;
  hint?: string;
  error?: string;
  input: React.ReactNode;
}) {
  const length = (useWatch({ control, name }) ?? "").length;
  return (
    <div className="grid grid-cols-1 gap-1.5">
      <Field label={label} hint={hint} error={error}>
        {input}
      </Field>
      <span className={cn("text-right text-[11px]", length > max ? "text-amber-400" : "text-white/35")}>
        {t.chars(length, max)}
        {length > max && ` · ${t.tooLong}`}
      </span>
    </div>
  );
}

/** Google result and link-preview card, updated as you type. */
function Previews({ control, pageKey }: { control: Control<FormIn>; pageKey: SeoPageKey }) {
  const [siteName, siteUrl, template, defaultDescription, defaultImage, page] = useWatch({
    control,
    name: ["siteName", "siteUrl", "titleTemplate", "defaultDescription", "defaultImage", `pages.${pageKey}`],
  });
  const raw = page?.title || siteName || "";
  const title = pageKey === "home" ? raw : (template || "%s").replace("%s", raw);
  const description = page?.description || defaultDescription || "";
  const image = page?.image || defaultImage;
  const url = `${(siteUrl || "").replace(/\/$/, "")}${SEO_PAGES[pageKey] === "/" ? "" : SEO_PAGES[pageKey]}`;
  const host = url.replace(/^https?:\/\//, "").split("/")[0];

  return (
    <div className="grid content-start gap-4">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] text-white/50 uppercase">
          <SearchIcon className="size-3.5" /> {t.previewGoogle}
        </p>
        <div className="rounded-lg bg-white p-4 text-left">
          <p className="flex items-center gap-2 text-xs text-[#202124]">
            <span className="grid size-6 place-items-center rounded-full bg-[#f1f3f4] text-[10px] font-bold">NB</span>
            <span className="min-w-0">
              <span className="block truncate">{siteName}</span>
              <span className="block truncate text-[#4d5156]">{url}</span>
            </span>
          </p>
          <p className="mt-2 line-clamp-1 text-lg leading-snug text-[#1a0dab]">{title}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#4d5156]">{description}</p>
        </div>
      </div>
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] text-white/50 uppercase">
          <GlobeIcon className="size-3.5" /> {t.previewSocial}
        </p>
        <div className="overflow-hidden rounded-lg border-l-4 border-brand bg-[#2b2d31] text-left">
          <div className="p-3">
            <p className="text-xs text-white/60">{siteName}</p>
            <p className="mt-1 line-clamp-2 text-sm font-semibold text-[#00a8fc]">{title}</p>
            <p className="mt-1 line-clamp-3 text-xs text-white/80">{description}</p>
          </div>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary preview URL typed by the admin
            <img src={image} alt="" className="aspect-[1200/630] w-full object-cover" />
          ) : (
            <div className="grid aspect-[1200/630] place-items-center bg-white/5 text-white/30">
              <ImageIcon className="size-8" />
            </div>
          )}
          <p className="px-3 py-2 text-[11px] text-white/40">{host}</p>
        </div>
      </div>
    </div>
  );
}
