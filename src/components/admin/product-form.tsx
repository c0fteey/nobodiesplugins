"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/db/schema";
import { deleteProductAction, saveProductAction } from "@/actions/admin";
import { productSchema } from "@/lib/validations/store";
import { formatPrice, slugify } from "@/lib/format";
import { ProductArt } from "@/components/store/product-art";
import { ImageUploadButton } from "@/components/media/image-upload";
import { BlocksEditor, HighlightsEditor } from "./blocks-editor";
import { Field, inputCls, Section, textareaCls, Toggle } from "./form-bits";

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
      toast.success(product ? "Product updated" : "Product created");
      router.push("/admin/products");
    });

  const onDelete = () => {
    if (!product || !confirm(`Delete ${product.name}? This can't be undone.`)) return;
    startDelete(async () => {
      const result = await deleteProductAction(product.id);
      if (!result.ok) return void toast.error(result.error);
      toast.success("Product deleted");
      router.push("/admin/products");
    });
  };

  const previewPrice = Number(v.price) * 100 || 0;
  const previewCompare = v.compareAt ? Number(v.compareAt) * 100 : null;

  return (
    <FormProvider {...form}>
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="grid gap-6">
        <Section title="Basics">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" error={errors.name?.message}>
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
            <Field label="Slug (URL)" hint={`/products/${v.slug || "…"}`} error={errors.slug?.message}>
              <input {...register("slug")} className={inputCls} aria-invalid={!!errors.slug} />
            </Field>
            <Field label="Type" error={errors.type?.message}>
              <select {...register("type")} className={inputCls}>
                <option value="plugin">Plugin</option>
                <option value="addon">Add-on</option>
                <option value="model">Model</option>
                <option value="build">Build</option>
              </select>
            </Field>
            {v.type === "addon" ? (
              <Field label="Belongs to plugin" error={errors.parentId?.message}>
                <select
                  {...register("parentId", { setValueAs: (val) => (val === "" ? null : val) })}
                  className={inputCls}
                  aria-invalid={!!errors.parentId}
                >
                  <option value="">Choose a plugin…</option>
                  {plugins.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Tagline" hint="Shown in the dashboard, e.g. Rewards & animations" error={errors.tagline?.message}>
                <input {...register("tagline")} className={inputCls} />
              </Field>
            )}
          </div>
          <Field label="Short description" hint="One or two sentences for cards" error={errors.shortDescription?.message}>
            <textarea {...register("shortDescription")} rows={2} className={textareaCls} aria-invalid={!!errors.shortDescription} />
          </Field>
          <Field label="Full description" hint="Shown on the product page" error={errors.description?.message}>
            <textarea {...register("description")} rows={8} className={textareaCls} />
          </Field>
        </Section>

        <Section title="Pricing">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Price (€)" hint="0 = free (claimable)" error={errors.price?.message}>
              <input type="number" step="0.01" min="0" {...register("price")} className={inputCls} aria-invalid={!!errors.price} />
            </Field>
            <Field label="Compare-at price (€)" hint="Struck-through old price" error={errors.compareAt?.message}>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("compareAt", { setValueAs: (val) => (val === "" || val == null ? null : val) })}
                className={inputCls}
              />
            </Field>
            <Field label="Badge">
              <select {...register("badge")} className={inputCls}>
                <option value="none">None</option>
                <option value="sale">Sale</option>
                <option value="new">New</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Cover & files">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Cover image URL" hint="Optional. Leave empty to use generated pixel art" error={errors.imageUrl?.message}>
              <div className="flex gap-2">
                <input {...register("imageUrl")} placeholder="https://…" className={inputCls} />
                <ImageUploadButton kind="product" onUploaded={(url) => setValue("imageUrl", url, { shouldDirty: true })} />
              </div>
            </Field>
            <Field label="Download URL" hint="Only given to buyers after an ownership check" error={errors.downloadUrl?.message}>
              <input {...register("downloadUrl")} placeholder="https://…" className={inputCls} />
            </Field>
            <Field label="Art title" hint="Big pixel text on the generated cover">
              <input {...register("artTitle")} placeholder="CRATES" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Color from" error={errors.accentFrom?.message}>
                <input type="color" {...register("accentFrom")} defaultValue={product?.accentFrom ?? "#6d28d9"} className={`${inputCls} p-1`} />
              </Field>
              <Field label="Color to" error={errors.accentTo?.message}>
                <input type="color" {...register("accentTo")} defaultValue={product?.accentTo ?? "#a855f7"} className={`${inputCls} p-1`} />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Details">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Version" error={errors.version?.message}>
              <input {...register("version")} className={inputCls} />
            </Field>
            <Field label="Minecraft versions" hint="Comma separated">
              <input {...register("mcVersions")} className={inputCls} />
            </Field>
            <Field label="Sort order" hint="Lower comes first">
              <input type="number" {...register("sortOrder")} className={inputCls} />
            </Field>
          </div>
          <Field label="Tags" hint="Comma separated, e.g. Animated, Crates, Addon">
            <input {...register("tags")} className={inputCls} />
          </Field>
          <div className="flex gap-6">
            <Toggle label="Published" {...register("published")} />
            <Toggle label="Featured (popular products)" {...register("featured")} />
          </div>
        </Section>

        <Section title="Product page">
          <Field label="Wide banner image URL" hint="Shown under the header. Empty = generated cover art" error={errors.bannerUrl?.message}>
            <div className="flex gap-2">
              <input {...register("bannerUrl")} placeholder="https://…" className={inputCls} />
              <ImageUploadButton kind="banner" onUploaded={(url) => setValue("bannerUrl", url, { shouldDirty: true })} />
            </div>
          </Field>
          <div>
            <p className="mb-2 text-xs font-semibold text-white/80">Key stats (sidebar)</p>
            <HighlightsEditor />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-white/80">Page sections</p>
            {errors.content && <p className="mb-2 text-xs text-destructive">Some sections have invalid fields (check titles, URLs and lengths).</p>}
            <BlocksEditor />
          </div>
        </Section>
      </div>

      <aside className="h-fit space-y-4 xl:sticky xl:top-6">
        <div className="rounded-xl border border-white/10 bg-[#171717] p-5">
          <p className="mb-3 text-xs font-bold tracking-[0.14em] text-white/50">LIVE PREVIEW</p>
          <ProductArt
            product={{
              name: v.name || "Product",
              imageUrl: /^https?:\/\//.test(v.imageUrl ?? "") ? (v.imageUrl as string) : null,
              accentFrom: v.accentFrom ?? "#6d28d9",
              accentTo: v.accentTo ?? "#a855f7",
              artTitle: v.artTitle || null,
              type: v.type ?? "plugin",
            }}
            sizes="300px"
            className="aspect-[4/3] w-full rounded-sm"
          />
          <p className="mt-4 font-bold">{v.name || "Product name"}</p>
          <p className="mt-1 line-clamp-3 text-sm text-white/70">{v.shortDescription || "Short description"}</p>
          <p className="mt-3">
            {previewCompare ? <s className="mr-2 text-xs text-white/50">{formatPrice(previewCompare)}</s> : null}
            <span className="text-xl font-semibold">{previewPrice ? formatPrice(previewPrice) : "Free"}</span>
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand font-semibold text-white transition hover:bg-brand/85 disabled:opacity-60"
        >
          {saving && <Loader2Icon className="size-4 animate-spin" />}
          {product ? "Save changes" : "Create product"}
        </button>
        {product && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-destructive/40 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
          >
            <Trash2Icon className="size-4" /> Delete product
          </button>
        )}
      </aside>
    </form>
    </FormProvider>
  );
}
