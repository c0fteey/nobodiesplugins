"use client";

import { useState } from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, CopyIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { BLOCK_ICONS, BLOCK_LABELS, emptyBlock, type BlockType } from "@/lib/content-blocks";
import { cn } from "@/lib/utils";
import { ImageUploadButton } from "@/components/media/image-upload";
import { Field, inputCls, selectCls, textareaCls, Toggle } from "./form-bits";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { BlockIcon } from "@/components/store/product-page/block-icon";
import { IconBtn } from "./settings-form";
import { admin } from "@/lang/admin";

const t = admin.blocks;
const f = t.itemFields;

// The product form's content is a union of block shapes; the editor works on it loosely
type LooseForm = {
  content: Record<string, unknown>[];
  highlights: { label: string; value: string }[];
};

const ITEM_FIELDS: Partial<Record<BlockType, { key: string; label: string; textarea?: boolean; icon?: boolean; image?: boolean }[]>> = {
  features: [
    { key: "icon", label: f.icon, icon: true },
    { key: "title", label: f.title },
    { key: "text", label: f.text, textarea: true },
  ],
  cards: [
    { key: "title", label: f.title },
    { key: "text", label: f.text, textarea: true },
    { key: "imageUrl", label: f.imageUrl, image: true },
  ],
  stats: [
    { key: "value", label: f.value },
    { key: "label", label: f.label },
  ],
  list: [
    { key: "title", label: f.title },
    { key: "text", label: f.text },
  ],
  chips: [{ key: "label", label: f.label }],
  faq: [
    { key: "question", label: f.question },
    { key: "answer", label: f.answer, textarea: true },
  ],
};

const ICON_OPTIONS = BLOCK_ICONS.map((icon) => ({ value: icon, label: icon, icon: <BlockIcon name={icon} className="size-4 text-brand-soft" /> }));

const EMPTY_ITEM: Partial<Record<BlockType, Record<string, unknown>>> = {
  features: { icon: "sparkles", title: "", text: "" },
  cards: { title: "", text: "", imageUrl: "" },
  stats: { value: "", label: "" },
  list: { title: "", text: "" },
  chips: { label: "" },
  faq: { question: "", answer: "" },
};

export function BlocksEditor() {
  const { control } = useFormContext<LooseForm>();
  const { fields, append, remove, move, insert } = useFieldArray({ control, name: "content" });
  const blocks = useWatch({ control, name: "content" }) ?? [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="rounded-lg border border-dashed border-white/15 p-6 text-center text-sm text-white/50">
          {t.empty}
        </p>
      )}
      <AnimatePresence initial={false}>
        {fields.map((field, i) => {
          const block = (blocks[i] ?? field) as Record<string, unknown>;
          const type = block.type as BlockType;
          const open = openIndex === i;
          return (
            <motion.div
              key={field.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-xl border border-white/10 bg-[#121212]"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-7 place-items-center rounded-md bg-white/5 font-mono text-xs text-white/50">{i + 1}</span>
                <button type="button" onClick={() => setOpenIndex(open ? null : i)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className="rounded bg-brand/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-soft uppercase">{type}</span>
                  <span className="truncate text-sm font-semibold">{String(block.title ?? "") || BLOCK_LABELS[type]}</span>
                  <ChevronDownIcon className={cn("ml-auto size-4 shrink-0 text-white/40 transition", open && "rotate-180")} />
                </button>
                <span className="flex gap-1">
                  <IconBtn label={admin.common.moveUp} disabled={i === 0} onClick={() => { move(i, i - 1); setOpenIndex(null); }}><ArrowUpIcon className="size-4" /></IconBtn>
                  <IconBtn label={admin.common.moveDown} disabled={i === fields.length - 1} onClick={() => { move(i, i + 1); setOpenIndex(null); }}><ArrowDownIcon className="size-4" /></IconBtn>
                  <IconBtn label={admin.common.duplicate} onClick={() => insert(i + 1, structuredClone(block))}><CopyIcon className="size-4" /></IconBtn>
                  <IconBtn label={admin.common.remove} danger onClick={() => { remove(i); setOpenIndex(null); }}><Trash2Icon className="size-4" /></IconBtn>
                </span>
              </div>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/5 p-4">
                      <BlockFields index={i} type={type} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-dashed border-white/20 px-4 text-sm font-semibold text-white/80 transition hover:border-brand hover:text-white"
        >
          <PlusIcon className="size-4" /> {t.addSection}
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-12 left-0 z-20 grid w-72 gap-0.5 rounded-lg border border-white/10 bg-[#1c1c1e] p-1.5 shadow-2xl"
            >
              {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    append(emptyBlock(t) as unknown as Record<string, unknown>);
                    setOpenIndex(fields.length);
                    setMenuOpen(false);
                  }}
                  className="rounded-md px-3 py-2 text-left text-sm transition hover:bg-brand/20"
                >
                  {BLOCK_LABELS[t]}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BlockFields({ index, type }: { index: number; type: BlockType }) {
  const { register, setValue, control } = useFormContext<LooseForm>();
  const p = (key: string) => `content.${index}.${key}` as `content.${number}.${string}`;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        {type !== "faq" && (
          <Field label={t.eyebrow}>
            <input {...register(p("eyebrow"))} className={inputCls} />
          </Field>
        )}
        <Field label={t.title} className={type === "faq" ? "md:col-span-2" : undefined}>
          <input {...register(p("title"))} className={inputCls} />
        </Field>
      </div>
      {type !== "faq" && (
        <Field label={type === "intro" || type === "media" ? t.text : t.subtitle}>
          <textarea {...register(p("text"))} rows={type === "intro" || type === "media" ? 4 : 2} className={textareaCls} />
        </Field>
      )}
      {type === "media" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t.imageUrl} hint={t.imageUrlHint}>
            <div className="flex gap-2">
              <input {...register(p("imageUrl"))} placeholder="https://…" className={inputCls} />
              <ImageUploadButton kind="block" onUploaded={(url) => setValue(p("imageUrl"), url, { shouldDirty: true })} />
            </div>
          </Field>
          <div className="flex items-end pb-2">
            <Toggle label={t.imageLeft} control={control} name={p("imageLeft") as never} />
          </div>
        </div>
      )}
      {type === "video" && (
        <Field label={t.youtube} hint={t.youtubeHint}>
          <input {...register(p("url"))} className={inputCls} />
        </Field>
      )}
      {ITEM_FIELDS[type] && <ItemsEditor index={index} type={type} />}
    </div>
  );
}

function ItemsEditor({ index, type }: { index: number; type: BlockType }) {
  const { control, register, setValue } = useFormContext<LooseForm>();
  const name = `content.${index}.items` as `content.${number}.${string}`;
  // useFieldArray needs an array path; the loose form type can't express it, so cast once here
  const { fields, append, remove, move } = useFieldArray({ control, name: name as never });
  const columns = ITEM_FIELDS[type]!;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-white/80">{t.items(fields.length)}</p>
      <div className="space-y-2">
        {fields.map((field, k) => (
          <div key={field.id} className="flex items-start gap-2 rounded-lg bg-white/[0.03] p-2">
            <div className={cn("grid flex-1 gap-2", columns.length > 1 && "md:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]")}>
              {columns.map((col) =>
                col.icon ? (
                  <Controller
                    key={col.key}
                    control={control}
                    name={`${name}.${k}.${col.key}` as never}
                    render={({ field }) => (
                      <ChoiceSelect
                        value={(field.value as string) ?? "sparkles"}
                        onChange={field.onChange}
                        options={ICON_OPTIONS}
                        aria-label={col.label}
                        className={selectCls}
                      />
                    )}
                  />
                ) : col.textarea ? (
                  <textarea key={col.key} rows={2} placeholder={col.label} aria-label={col.label} {...register(`${name}.${k}.${col.key}` as never)} className={textareaCls} />
                ) : col.image ? (
                  <div key={col.key} className="flex gap-2">
                    <input placeholder={col.label} aria-label={col.label} {...register(`${name}.${k}.${col.key}` as never)} className={inputCls} />
                    <ImageUploadButton
                      kind="block"
                      label=""
                      onUploaded={(url) => setValue(`${name}.${k}.${col.key}` as never, url as never, { shouldDirty: true })}
                    />
                  </div>
                ) : (
                  <input key={col.key} placeholder={col.label} aria-label={col.label} {...register(`${name}.${k}.${col.key}` as never)} className={inputCls} />
                ),
              )}
            </div>
            <div className="flex flex-col gap-1">
              <IconBtn label={admin.common.moveUp} disabled={k === 0} onClick={() => move(k, k - 1)}><ArrowUpIcon className="size-3.5" /></IconBtn>
              <IconBtn label={t.removeItem} danger onClick={() => remove(k)}><XIcon className="size-3.5" /></IconBtn>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => append(EMPTY_ITEM[type] as never)}
        className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-brand-soft hover:bg-brand/10"
      >
        <PlusIcon className="size-3.5" /> {t.addItem}
      </button>
    </div>
  );
}

export function HighlightsEditor() {
  const { control, register } = useFormContext<LooseForm>();
  const { fields, append, remove } = useFieldArray({ control, name: "highlights" });

  return (
    <div className="space-y-2">
      {fields.map((field, i) => (
        <div key={field.id} className="flex gap-2">
          <input {...register(`highlights.${i}.label`)} placeholder={t.highlightLabel} className={inputCls} />
          <input {...register(`highlights.${i}.value`)} placeholder={t.highlightValue} className={inputCls} />
          <IconBtn label={admin.common.remove} danger onClick={() => remove(i)}><XIcon className="size-4" /></IconBtn>
        </div>
      ))}
      {fields.length < 12 && (
        <button
          type="button"
          onClick={() => append({ label: "", value: "" })}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-brand-soft hover:bg-brand/10"
        >
          <PlusIcon className="size-3.5" /> {t.addHighlight}
        </button>
      )}
    </div>
  );
}
