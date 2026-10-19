"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import type { Faq, Partner } from "@/db/schema";
import {
  deleteFaqAction,
  deletePartnerAction,
  saveFaqAction,
  savePartnerAction,
  type AdminResult,
} from "@/actions/admin";
import { faqSchema, partnerSchema } from "@/lib/validations/store";
import { ImageUploadButton } from "@/components/media/image-upload";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { Field, inputCls, textareaCls, Toggle } from "./form-bits";
import { admin } from "@/lang/admin";

const tf = admin.faqs;
const tp = admin.partners;

function useAdminMutation() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<AdminResult>, message: string, after?: () => void) =>
    start(async () => {
      const result = await fn();
      if (!result.ok) return void toast.error(result.error);
      toast.success(message);
      after?.();
      router.refresh();
    });
  return { pending, run };
}

/* ---------------- FAQ ---------------- */

type FaqIn = z.input<typeof faqSchema>;
type FaqOut = z.output<typeof faqSchema>;

function FaqForm({ faq, onDone }: { faq?: Faq; onDone: () => void }) {
  const { pending, run } = useAdminMutation();
  const { register, handleSubmit, control, formState: { errors } } = useForm<FaqIn, unknown, FaqOut>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      id: faq?.id,
      question: faq?.question ?? "",
      answer: faq?.answer ?? "",
      sortOrder: faq?.sortOrder ?? 0,
      published: faq?.published ?? true,
    },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => run(() => saveFaqAction(values), tf.saved, onDone))}
      className="grid gap-3 rounded-lg border border-brand/30 bg-brand/5 p-4"
    >
      <Field label={tf.question} error={errors.question?.message}>
        <input {...register("question")} className={inputCls} />
      </Field>
      <Field label={tf.answer} error={errors.answer?.message}>
        <textarea {...register("answer")} rows={4} className={textareaCls} />
      </Field>
      <div className="flex flex-wrap items-end gap-4">
        <Field label={admin.common.sortOrder} className="w-28">
          <input type="number" {...register("sortOrder")} className={inputCls} />
        </Field>
        <Toggle label={admin.common.published} control={control} name="published" />
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onDone} className="h-9 rounded-md px-4 text-sm text-white/70 hover:text-white">{admin.common.cancel}</button>
          <button type="submit" disabled={pending} className="flex h-9 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white">
            {pending && <Loader2Icon className="size-4 animate-spin" />} {admin.common.save}
          </button>
        </div>
      </div>
    </form>
  );
}

export function FaqEditor({ faqs }: { faqs: Faq[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const { run } = useAdminMutation();

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {editing === "new" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <FaqForm onDone={() => setEditing(null)} />
          </motion.div>
        )}
      </AnimatePresence>
      {editing !== "new" && (
        <button type="button" onClick={() => setEditing("new")} className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white">
          <PlusIcon className="size-4" /> {tf.newQuestion}
        </button>
      )}
      {faqs.map((faq) =>
        editing === faq.id ? (
          <FaqForm key={faq.id} faq={faq} onDone={() => setEditing(null)} />
        ) : (
          <div key={faq.id} className="flex items-start gap-4 rounded-lg border border-white/10 bg-[#171717] p-4">
            <span className="mt-0.5 font-mono text-xs text-white/40">{faq.sortOrder}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {faq.question} {!faq.published && <span className="ml-2 text-xs text-white/40">{tf.draftSuffix}</span>}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-white/60">{faq.answer}</p>
            </div>
            <button type="button" onClick={() => setEditing(faq.id)} aria-label={admin.common.edit} className="text-white/60 hover:text-white">
              <PencilIcon className="size-4" />
            </button>
            <button
              type="button"
              aria-label={admin.common.delete}
              onClick={async () =>
                (await confirmDialog({ title: tf.deleteConfirm, confirmLabel: admin.common.delete })) && run(() => deleteFaqAction(faq.id), tf.deleted)
              }
              className="text-white/60 hover:text-destructive"
            >
              <Trash2Icon className="size-4" />
            </button>
          </div>
        ),
      )}
    </div>
  );
}

/* ---------------- Partners ---------------- */

type PartnerIn = z.input<typeof partnerSchema>;
type PartnerOut = z.output<typeof partnerSchema>;

function PartnerForm({ partner, onDone }: { partner?: Partner; onDone: () => void }) {
  const { pending, run } = useAdminMutation();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PartnerIn, unknown, PartnerOut>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      id: partner?.id,
      name: partner?.name ?? "",
      playersAvg: partner?.playersAvg ?? 0,
      logoUrl: partner?.logoUrl ?? "",
      color: partner?.color ?? "#7c5cff",
      sortOrder: partner?.sortOrder ?? 0,
    },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => run(() => savePartnerAction(values), tp.saved, onDone))}
      className="grid items-end gap-3 rounded-lg border border-brand/30 bg-brand/5 p-4 md:grid-cols-[1fr_120px_90px_90px_auto]"
    >
      <Field label={tp.name} error={errors.name?.message}>
        <input {...register("name")} className={inputCls} />
      </Field>
      <Field label={tp.playersAvg} error={errors.playersAvg?.message}>
        <input type="number" {...register("playersAvg")} className={inputCls} />
      </Field>
      <Field label={tp.color}>
        <input type="color" {...register("color")} defaultValue={partner?.color ?? "#7c5cff"} className={`${inputCls} p-1`} />
      </Field>
      <Field label={tp.order}>
        <input type="number" {...register("sortOrder")} className={inputCls} />
      </Field>
      <Field label={tp.logo} hint={tp.logoHint} error={errors.logoUrl?.message} className="md:col-span-4">
        <div className="flex gap-2">
          <input {...register("logoUrl")} placeholder="https://…" className={inputCls} />
          <ImageUploadButton kind="logo" onUploaded={(url) => setValue("logoUrl", url, { shouldDirty: true })} />
        </div>
      </Field>
      <div className="flex gap-2">
        <button type="button" onClick={onDone} aria-label={admin.common.cancel} className="grid size-10 place-items-center rounded-md text-white/60 hover:text-white">
          <XIcon className="size-4" />
        </button>
        <button type="submit" disabled={pending} className="flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white">
          {pending && <Loader2Icon className="size-4 animate-spin" />} {admin.common.save}
        </button>
      </div>
    </form>
  );
}

export function PartnerEditor({ partners }: { partners: Partner[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const { run } = useAdminMutation();

  return (
    <div className="space-y-3">
      {editing === "new" ? (
        <PartnerForm onDone={() => setEditing(null)} />
      ) : (
        <button type="button" onClick={() => setEditing("new")} className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white">
          <PlusIcon className="size-4" /> {tp.newPartner}
        </button>
      )}
      {partners.map((p) =>
        editing === p.id ? (
          <PartnerForm key={p.id} partner={p} onDone={() => setEditing(null)} />
        ) : (
          <div key={p.id} className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#171717] p-4">
            {p.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
              <img src={p.logoUrl} alt="" className="size-9 rounded-md object-cover" />
            ) : (
              <span className="grid size-9 place-items-center rounded-md font-black" style={{ background: p.color }}>
                {p.name[0]}
              </span>
            )}
            <div className="flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-white/50">{tp.playersAvgText(p.playersAvg)}</p>
            </div>
            <button type="button" onClick={() => setEditing(p.id)} aria-label={admin.common.edit} className="text-white/60 hover:text-white">
              <PencilIcon className="size-4" />
            </button>
            <button
              type="button"
              aria-label={admin.common.delete}
              onClick={async () =>
                (await confirmDialog({ title: admin.common.deleteConfirm(p.name), confirmLabel: admin.common.delete })) &&
                run(() => deletePartnerAction(p.id), tp.deleted)
              }
              className="text-white/60 hover:text-destructive"
            >
              <Trash2Icon className="size-4" />
            </button>
          </div>
        ),
      )}
    </div>
  );
}
