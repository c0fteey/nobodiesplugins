"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { DocPage } from "@/db/schema";
import { deleteDocAction, saveDocAction } from "@/actions/admin";
import { docSchema } from "@/lib/validations/store";
import { slugify } from "@/lib/format";
import { DocContent } from "@/components/store/doc-content";
import { Field, inputCls, Section, textareaCls, Toggle } from "./form-bits";

type FormIn = z.input<typeof docSchema>;
type FormOut = z.output<typeof docSchema>;

export function DocForm({ doc, plugins }: { doc: DocPage | null; plugins: { id: string; name: string }[] }) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(docSchema),
    defaultValues: {
      id: doc?.id,
      title: doc?.title ?? "",
      slug: doc?.slug ?? "",
      productId: doc?.productId ?? null,
      summary: doc?.summary ?? "",
      content: doc?.content ?? "# Getting started\n\nWrite your page here. Use `code`, **bold**, - lists and ``` blocks.",
      sortOrder: doc?.sortOrder ?? 0,
      published: doc?.published ?? true,
    },
  });
  const content = useWatch({ control, name: "content" }) ?? "";

  const onSubmit = (values: FormOut) =>
    startSave(async () => {
      const result = await saveDocAction(values);
      if (!result.ok) return void toast.error(result.error);
      toast.success("Page saved");
      router.push("/admin/docs");
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 2xl:grid-cols-2">
      <div className="grid content-start gap-6">
        <Section title="Page">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title" error={errors.title?.message}>
              <input
                {...register("title", { onChange: (e) => !doc && setValue("slug", slugify(e.target.value)) })}
                className={inputCls}
                aria-invalid={!!errors.title}
              />
            </Field>
            <Field label="Slug" error={errors.slug?.message}>
              <input {...register("slug")} className={inputCls} aria-invalid={!!errors.slug} />
            </Field>
            <Field label="Plugin" hint="Leave empty for a general Resources page">
              <select {...register("productId", { setValueAs: (val) => (val === "" ? null : val) })} className={inputCls}>
                <option value="">Resources (no plugin)</option>
                {plugins.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sort order">
              <input type="number" {...register("sortOrder")} className={inputCls} />
            </Field>
          </div>
          <Field label="Summary" error={errors.summary?.message}>
            <input {...register("summary")} className={inputCls} />
          </Field>
          <Field label="Content (markdown)" error={errors.content?.message}>
            <textarea {...register("content")} rows={18} className={`${textareaCls} font-mono text-xs`} />
          </Field>
          <Toggle label="Published" {...register("published")} />
        </Section>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-brand font-semibold text-white transition hover:bg-brand/85 disabled:opacity-60">
            {saving && <Loader2Icon className="size-4 animate-spin" />} {doc ? "Save changes" : "Create page"}
          </button>
          {doc && (
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                if (!confirm(`Delete "${doc.title}"?`)) return;
                startDelete(async () => {
                  const result = await deleteDocAction(doc.id);
                  if (!result.ok) return void toast.error(result.error);
                  toast.success("Page deleted");
                  router.push("/admin/docs");
                });
              }}
              className="grid size-11 place-items-center rounded-md border border-destructive/40 text-destructive transition hover:bg-destructive/10"
              aria-label="Delete page"
            >
              <Trash2Icon className="size-4" />
            </button>
          )}
        </div>
      </div>
      <div className="h-fit rounded-xl border border-white/10 bg-[#171717] p-6 2xl:sticky 2xl:top-6">
        <p className="text-xs font-bold tracking-[0.14em] text-white/50">LIVE PREVIEW</p>
        <DocContent source={content} />
      </div>
    </form>
  );
}
