"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { DicesIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { Coupon } from "@/db/schema";
import { deleteCouponAction, saveCouponAction } from "@/actions/admin";
import { couponSchema } from "@/lib/validations/store";
import { PRODUCT_TYPE_LABEL, toDateTimeLocal } from "@/lib/format";
import { Field, inputCls, Section, selectCls, Toggle } from "./form-bits";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { admin } from "@/lang/admin";

const t = admin.coupons.form;

type FormIn = z.input<typeof couponSchema>;
type FormOut = z.output<typeof couponSchema>;
type ProductOption = { id: string; name: string; type: keyof typeof PRODUCT_TYPE_LABEL };

const nullIfEmpty = (v: unknown) => (v === "" || v == null ? null : v);

const TYPE_OPTIONS = [
  { value: "percent", label: t.percent },
  { value: "fixed", label: t.fixed },
] as const;

function DatePickerField({ value, onChange, invalid }: { value: unknown; onChange: (v: string) => void; invalid?: boolean }) {
  return (
    <DateTimePicker
      value={typeof value === "string" ? value : toDateTimeLocal(value as Date | null)}
      onChange={onChange}
      placeholder={admin.common.pickDate}
      clearLabel={admin.common.clearDate}
      timeLabel={admin.common.time}
      invalid={invalid}
      className={selectCls}
    />
  );
}

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => alphabet[b % alphabet.length]).join("");
}

export function CouponForm({ coupon, ownerEmail, products }: { coupon: Coupon | null; ownerEmail: string; products: ProductOption[] }) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [filter, setFilter] = useState("");

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      id: coupon?.id,
      code: coupon?.code ?? "",
      description: coupon?.description ?? "",
      type: coupon?.type ?? "percent",
      amount: coupon ? (coupon.type === "fixed" ? coupon.amount / 100 : coupon.amount) : 10,
      minSubtotal: coupon ? coupon.minSubtotalCents / 100 : 0,
      maxUses: coupon?.maxUses ?? null,
      perUserLimit: coupon?.perUserLimit ?? 1,
      userEmail: ownerEmail,
      productIds: coupon?.productIds ?? [],
      creatorName: coupon?.creatorName ?? "",
      startsAt: toDateTimeLocal(coupon?.startsAt),
      expiresAt: toDateTimeLocal(coupon?.expiresAt),
      active: coupon?.active ?? true,
    },
  });
  const type = useWatch({ control, name: "type" });
  const visible = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(filter.trim().toLowerCase())),
    [products, filter],
  );

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        startSave(async () => {
          const result = await saveCouponAction(values);
          if (!result.ok) return void toast.error(result.error);
          toast.success(coupon ? t.updated : t.created);
          router.push("/admin/coupons");
        }),
      )}
      className="grid max-w-4xl gap-6"
    >
      <Section title={t.sections.code}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t.code} hint={t.codeHint} error={errors.code?.message}>
            <div className="flex gap-2">
              <input {...register("code")} className={`${inputCls} font-mono uppercase`} aria-invalid={!!errors.code} />
              <button
                type="button"
                title={t.generate}
                aria-label={t.generate}
                onClick={() => setValue("code", randomCode(), { shouldValidate: true })}
                className="grid size-10 shrink-0 place-items-center rounded-md border border-white/10 text-white/70 hover:text-white"
              >
                <DicesIcon className="size-4" />
              </button>
            </div>
          </Field>
          <Field label={t.internalDescription} error={errors.description?.message}>
            <input {...register("description")} placeholder={t.internalDescriptionPlaceholder} className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title={t.sections.discount}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label={t.type}>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <ChoiceSelect value={field.value ?? "percent"} onChange={field.onChange} options={TYPE_OPTIONS} aria-label={t.type} className={selectCls} />
              )}
            />
          </Field>
          <Field label={type === "fixed" ? t.amountFixed : t.amountPercent} error={errors.amount?.message}>
            <input type="number" step={type === "fixed" ? "0.01" : "1"} {...register("amount")} className={inputCls} />
          </Field>
          <Field label={t.minCart} hint={t.minCartHint} error={errors.minSubtotal?.message}>
            <input type="number" step="0.01" {...register("minSubtotal")} className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title={t.sections.who}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label={t.lockEmail}
            hint={t.lockEmailHint}
            error={errors.userEmail?.message}
          >
            <input type="email" {...register("userEmail")} placeholder={t.lockEmailPlaceholder} className={inputCls} />
          </Field>
          <Field label={t.creator} hint={t.creatorHint} error={errors.creatorName?.message}>
            <input {...register("creatorName")} className={inputCls} />
          </Field>
          <Field label={t.totalUses} hint={t.totalUsesHint} error={errors.maxUses?.message}>
            <input type="number" min="1" {...register("maxUses", { setValueAs: nullIfEmpty })} className={inputCls} />
          </Field>
          <Field label={t.perAccount} error={errors.perUserLimit?.message}>
            <input type="number" min="1" {...register("perUserLimit")} className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title={t.sections.valid}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t.starts} hint={t.startsHint} error={errors.startsAt?.message}>
            <Controller
              control={control}
              name="startsAt"
              render={({ field }) => <DatePickerField value={field.value} onChange={field.onChange} invalid={!!errors.startsAt} />}
            />
          </Field>
          <Field label={t.expires} hint={t.expiresHint} error={errors.expiresAt?.message}>
            <Controller
              control={control}
              name="expiresAt"
              render={({ field }) => <DatePickerField value={field.value} onChange={field.onChange} invalid={!!errors.expiresAt} />}
            />
          </Field>
        </div>
        <Controller
          control={control}
          name="productIds"
          render={({ field }) => {
            const selected = new Set(field.value ?? []);
            const toggle = (id: string) => {
              const next = new Set(selected);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              field.onChange([...next]);
            };
            return (
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-white/80">
                    {t.onlyProducts} {selected.size === 0 ? t.noneSelected : t.selected(selected.size)}
                  </span>
                  <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t.filter} className={`${inputCls} h-8 w-40`} />
                </div>
                <div className="grid max-h-56 gap-1 overflow-y-auto rounded-md border border-white/10 p-2 sm:grid-cols-2">
                  {visible.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-white/5">
                      <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} className="data-checked:border-brand data-checked:bg-brand" />
                      <span className="truncate">{p.name}</span>
                      <span className="ml-auto text-[10px] text-white/40">{PRODUCT_TYPE_LABEL[p.type]}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          }}
        />
        <Toggle label={admin.common.active} control={control} name="active" />
      </Section>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="flex h-11 w-48 items-center justify-center gap-2 rounded-md bg-brand font-semibold text-white transition hover:bg-brand/85 disabled:opacity-60">
          {saving && <Loader2Icon className="size-4 animate-spin" />} {coupon ? t.save : t.create}
        </button>
        {coupon && (
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              if (!(await confirmDialog({ title: admin.common.deleteConfirm(coupon.code), confirmLabel: admin.common.delete }))) return;
              startDelete(async () => {
                const result = await deleteCouponAction(coupon.id);
                if (!result.ok) return void toast.error(result.error);
                toast.success(t.deleted);
                router.push("/admin/coupons");
              });
            }}
            className="flex h-11 items-center gap-2 rounded-md border border-destructive/40 px-4 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            <Trash2Icon className="size-4" /> {admin.common.delete}
          </button>
        )}
      </div>
    </form>
  );
}
