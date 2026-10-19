"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CircleAlertIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { toast } from "sonner";
import type { Product } from "@/db/schema";
import { deleteProductAction, saveProductAction } from "@/actions/admin";
import { productSchema } from "@/lib/validations/store";
import { formatPrice, slugify } from "@/lib/format";
import { ProductArt } from "@/components/store/product-art";
import { ImageUploadButton } from "@/components/media/image-upload";
import { BlocksEditor, HighlightsEditor } from "./blocks-editor";
import { Field, inputCls, Section, selectCls, textareaCls, Toggle } from "./form-bits";
import { admin } from "@/lang/admin";
import { site } from "@/lang/site";

const t = admin.products.form;

const TYPE_OPTIONS = (["plugin", "addon", "model", "build"] as const).map((value) => ({ value, label: site.productTypes[value] }));
const BADGE_OPTIONS = (["none", "sale", "new"] as const).map((value) => ({ value, label: t.badges[value] }));

type FormIn = z.input<typeof productSchema>;
type FormOut = z.output<typeof productSchema>;

const euros = (cents: number | null | undefined) => (cents == null ? null : cents / 100);

export function ProductForm({ product, plugins }: { product: Product | null; plugins: { id: string; name: string }[] }) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: product?.id,
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      type: product?.type ?? "plugin",
      parentId: product?.parentId ?? null,
      tagline: product?.tagline ?? "",
      shortDescription: product?.shortDescription ?? "",
      description: product?.description ?? "",
      price: euros(product?.priceCents) ?? 0,
      compareAt: euros(product?.compareAtCents),
      badge: product?.badge ?? "none",
      imageUrl: product?.imageUrl ?? "",
      downloadUrl: product?.downloadUrl ?? "",
      requiresLicense: product?.requiresLicense ?? true,
      accentFrom: product?.accentFrom ?? "#6d28d9",
      accentTo: product?.accentTo ?? "#a855f7",
      artTitle: product?.artTitle ?? "",
      tags: product?.tags.join(", ") ?? "",
      mcVersions: product?.mcVersions.join(", ") ?? "1.20, 1.21",
      version: product?.version ?? "1.0.0",
      featured: product?.featured ?? false,
      published: product?.published ?? true,
      sortOrder: product?.sortOrder ?? 0,
      bannerUrl: product?.bannerUrl ?? "",
      highlights: product?.highlights ?? [],
      content: product?.content ?? [],
    },
  });
  const { register, handleSubmit, setValue, control, formState } = form;
  const errors = formState.errors;
  const v = useWatch({ control });

  const onSubmit = (values: FormOut) =>
    startSave(async () => {
      const result = await saveProductAction(values);
      if (!result.ok) return void toast.error(result.error);
      toast.success(product ? t.updated : t.created);
      // Next keeps visited pages mounted (Activity), so "new product" would reopen with this draft
      if (!product) form.reset();
      router.push("/admin/products");
    });

  const onDelete = async () => {
    if (!product) return;
    if (!(await confirmDialog({ title: admin.common.deleteConfirmPermanent(product.name), confirmLabel: admin.common.delete }))) return;
    startDelete(async () => {
      const result = await deleteProductAction(product.id);
      if (!result.ok) return void toast.error(result.error);
      toast.success(t.deleted);
      router.push("/admin/products");
    });
  };

  const previewPrice = Number(v.price) * 100 || 0;
  const previewCompare = v.compareAt ? Number(v.compareAt) * 100 : null;

  return (
    <FormProvider {...form}>
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="grid gap-6">
        <Section title={t.sections.basics}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.name} error={errors.name?.message}>
              <input
                {...register("name", {
                  onChange: (e) => {
                    if (!product) setValue("slug", slugify(e.target.value));
                  },
                })}
                className={inputCls}
                aria-invalid={!!errors.name}
              />
            </Field>
            <Field label={t.slug} hint={`/products/${v.slug || "…"}`} error={errors.slug?.message}>
              <input {...register("slug")} className={inputCls} aria-invalid={!!errors.slug} />
            </Field>
            <Field label={t.type} error={errors.type?.message}>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <ChoiceSelect value={field.value ?? "plugin"} onChange={field.onChange} options={TYPE_OPTIONS} aria-label={t.type} className={selectCls} />
                )}
              />
            </Field>
            {v.type === "addon" ? (
              <Field label={t.parent} error={errors.parentId?.message}>
                <Controller
                  control={control}
                  name="parentId"
                  render={({ field }) => (
                    <ChoiceSelect
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={plugins.map((p) => ({ value: p.id, label: p.name }))}
                      placeholder={t.choosePlugin}
                      aria-label={t.parent}
                      aria-invalid={!!errors.parentId}
                      className={selectCls}
                    />
                  )}
                />
              </Field>
            ) : (
              <Field label={t.tagline} hint={t.taglineHint} error={errors.tagline?.message}>
                <input {...register("tagline")} className={inputCls} />
              </Field>
            )}
          </div>
          <Field label={t.shortDescription} hint={t.shortDescriptionHint} error={errors.shortDescription?.message}>
            <textarea {...register("shortDescription")} rows={2} className={textareaCls} aria-invalid={!!errors.shortDescription} />
          </Field>
          <Field label={t.description} hint={t.descriptionHint} error={errors.description?.message}>
            <textarea {...register("description")} rows={8} className={textareaCls} />
          </Field>
        </Section>

        <Section title={t.sections.pricing}>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t.price} hint={t.priceHint} error={errors.price?.message}>
              <input type="number" step="0.01" min="0" {...register("price")} className={inputCls} aria-invalid={!!errors.price} />
            </Field>
            <Field label={t.compareAt} hint={t.compareAtHint} error={errors.compareAt?.message}>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("compareAt", { setValueAs: (val) => (val === "" || val == null ? null : val) })}
                className={inputCls}
              />
            </Field>
            <Field label={t.badge}>
              <Controller
                control={control}
                name="badge"
                render={({ field }) => (
                  <ChoiceSelect value={field.value ?? "none"} onChange={field.onChange} options={BADGE_OPTIONS} aria-label={t.badge} className={selectCls} />
                )}
              />
            </Field>
          </div>
        </Section>

        <Section title={t.sections.cover}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.coverImage} hint={t.coverImageHint} error={errors.imageUrl?.message}>
              <div className="flex gap-2">
                <input {...register("imageUrl")} placeholder="https://…" className={inputCls} />
                <ImageUploadButton kind="product" onUploaded={(url) => setValue("imageUrl", url, { shouldDirty: true })} />
              </div>
            </Field>
            <Field label={t.downloadUrl} hint={t.downloadUrlHint} error={errors.downloadUrl?.message}>
              <input {...register("downloadUrl")} placeholder="https://…" className={inputCls} />
            </Field>
            <Field label={t.artTitle} hint={t.artTitleHint}>
              <input {...register("artTitle")} placeholder="CRATES" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t.colorFrom} error={errors.accentFrom?.message}>
                <input type="color" {...register("accentFrom")} defaultValue={product?.accentFrom ?? "#6d28d9"} className={`${inputCls} p-1`} />
              </Field>
              <Field label={t.colorTo} error={errors.accentTo?.message}>
                <input type="color" {...register("accentTo")} defaultValue={product?.accentTo ?? "#a855f7"} className={`${inputCls} p-1`} />
              </Field>
            </div>
          </div>
        </Section>

        <Section title={t.sections.details}>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t.version} error={errors.version?.message}>
              <input {...register("version")} className={inputCls} />
            </Field>
            <Field label={t.mcVersions} hint={t.commaSeparated}>
              <input {...register("mcVersions")} className={inputCls} />
            </Field>
            <Field label={admin.common.sortOrder} hint={admin.common.sortOrderHint}>
              <input type="number" {...register("sortOrder")} className={inputCls} />
            </Field>
          </div>
          <Field label={t.tags} hint={t.tagsHint}>
            <input {...register("tags")} className={inputCls} />
          </Field>
          <div className="flex gap-6">
            <Toggle label={t.publishedToggle} control={control} name="published" />
            <Toggle label={t.featuredToggle} control={control} name="featured" />
            {v.type !== "addon" && <Toggle label={t.licenseToggle} control={control} name="requiresLicense" />}
          </div>
        </Section>

        <Section title={t.sections.page}>
          <Field label={t.banner} hint={t.bannerHint} error={errors.bannerUrl?.message}>
            <div className="flex gap-2">
              <input {...register("bannerUrl")} placeholder="https://…" className={inputCls} />
              <ImageUploadButton kind="banner" onUploaded={(url) => setValue("bannerUrl", url, { shouldDirty: true })} />
            </div>
          </Field>
          <div>
            <p className="mb-2 text-xs font-semibold text-white/80">{t.keyStats}</p>
            <HighlightsEditor />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-white/80">{t.pageSections}</p>
            {errors.content && (
              <Alert variant="destructive" className="mb-3">
                <CircleAlertIcon />
                <AlertDescription>{t.sectionsInvalid}</AlertDescription>
              </Alert>
            )}
            <BlocksEditor />
          </div>
        </Section>
      </div>

      <aside className="h-fit space-y-4 xl:sticky xl:top-6">
        <div className="rounded-xl border border-white/10 bg-[#171717] p-5">
          <p className="mb-3 text-xs font-bold tracking-[0.14em] text-white/50">{admin.common.livePreview}</p>
          <ProductArt
            product={{
              name: v.name || t.previewName,
              imageUrl: /^https?:\/\//.test(v.imageUrl ?? "") ? (v.imageUrl as string) : null,
              accentFrom: v.accentFrom ?? "#6d28d9",
              accentTo: v.accentTo ?? "#a855f7",
              artTitle: v.artTitle || null,
              type: v.type ?? "plugin",
            }}
            sizes="300px"
            className="aspect-[4/3] w-full rounded-sm"
          />
          <p className="mt-4 font-bold">{v.name || t.previewNamePlaceholder}</p>
          <p className="mt-1 line-clamp-3 text-sm text-white/70">{v.shortDescription || t.previewDescription}</p>
          <p className="mt-3">
            {previewCompare ? <s className="mr-2 text-xs text-white/50">{formatPrice(previewCompare)}</s> : null}
            <span className="text-xl font-semibold">{previewPrice ? formatPrice(previewPrice) : admin.common.free}</span>
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand font-semibold text-white transition hover:bg-brand/85 disabled:opacity-60"
        >
          {saving && <Loader2Icon className="size-4 animate-spin" />}
          {product ? t.saveChanges : t.create}
        </button>
        {product && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-destructive/40 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
          >
            <Trash2Icon className="size-4" /> {t.delete}
          </button>
        )}
      </aside>
    </form>
    </FormProvider>
  );
}
