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
import { Field, inputCls, Section, Toggle } from "./form-bits";

type FormIn = z.input<typeof couponSchema>;
type FormOut = z.output<typeof couponSchema>;
type ProductOption = { id: string; name: string; type: keyof typeof PRODUCT_TYPE_LABEL };

const nullIfEmpty = (v: unknown) => (v === "" || v == null ? null : v);

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
          toast.success(coupon ? "Coupon updated" : "Coupon created");
          router.push("/admin/coupons");
        }),
      )}
      className="grid max-w-4xl gap-6"
    >
      <Section title="Code">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Coupon code" hint="Customers type it at checkout (not case-sensitive)" error={errors.code?.message}>
            <div className="flex gap-2">
              <input {...register("code")} className={`${inputCls} font-mono uppercase`} aria-invalid={!!errors.code} />
              <button
                type="button"
                title="Generate a random code"
                onClick={() => setValue("code", randomCode(), { shouldValidate: true })}
                className="grid size-10 shrink-0 place-items-center rounded-md border border-white/10 text-white/70 hover:text-white"
              >
                <DicesIcon className="size-4" />
              </button>
            </div>
          </Field>
          <Field label="Internal description" error={errors.description?.message}>
            <input {...register("description")} placeholder="e.g. Black Friday, YouTube partner" className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="Discount">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Type">
            <select {...register("type")} className={inputCls}>
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed amount (€)</option>
            </select>
          </Field>
          <Field label={type === "fixed" ? "Amount (€)" : "Percent (%)"} error={errors.amount?.message}>
            <input type="number" step={type === "fixed" ? "0.01" : "1"} {...register("amount")} className={inputCls} />
          </Field>
          <Field label="Minimum cart (€)" hint="0 = no minimum" error={errors.minSubtotal?.message}>
            <input type="number" step="0.01" {...register("minSubtotal")} className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="Who can use it">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Lock to an account (email)"
            hint="Only this account can use it and it shows up in their dashboard. Leave empty for everyone."
            error={errors.userEmail?.message}
          >
            <input type="email" {...register("userEmail")} placeholder="player@example.com" className={inputCls} />
          </Field>
          <Field label="Creator / partner name" hint="Shown next to the discount, e.g. a YouTuber's name" error={errors.creatorName?.message}>
            <input {...register("creatorName")} className={inputCls} />
          </Field>
          <Field label="Total uses" hint="Empty = unlimited" error={errors.maxUses?.message}>
            <input type="number" min="1" {...register("maxUses", { setValueAs: nullIfEmpty })} className={inputCls} />
          </Field>
          <Field label="Uses per account" error={errors.perUserLimit?.message}>
            <input type="number" min="1" {...register("perUserLimit")} className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="Valid for">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Starts" hint="Empty = immediately" error={errors.startsAt?.message}>
            <input type="datetime-local" {...register("startsAt")} className={inputCls} />
          </Field>
          <Field label="Expires" hint="Empty = never" error={errors.expiresAt?.message}>
            <input type="datetime-local" {...register("expiresAt")} className={inputCls} />
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
                    Only these products {selected.size === 0 ? "(none selected = whole cart)" : `(${selected.size} selected)`}
                  </span>
                  <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter…" className={`${inputCls} h-8 w-40`} />
                </div>
                <div className="grid max-h-56 gap-1 overflow-y-auto rounded-md border border-white/10 p-2 sm:grid-cols-2">
                  {visible.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-white/5">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="size-4 accent-brand" />
                      <span className="truncate">{p.name}</span>
                      <span className="ml-auto text-[10px] text-white/40">{PRODUCT_TYPE_LABEL[p.type]}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          }}
        />
        <Toggle label="Active" {...register("active")} />
      </Section>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="flex h-11 w-48 items-center justify-center gap-2 rounded-md bg-brand font-semibold text-white transition hover:bg-brand/85 disabled:opacity-60">
          {saving && <Loader2Icon className="size-4 animate-spin" />} {coupon ? "Save coupon" : "Create coupon"}
        </button>
        {coupon && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (!confirm(`Delete ${coupon.code}?`)) return;
              startDelete(async () => {
                const result = await deleteCouponAction(coupon.id);
                if (!result.ok) return void toast.error(result.error);
                toast.success("Coupon deleted");
                router.push("/admin/coupons");
              });
            }}
            className="flex h-11 items-center gap-2 rounded-md border border-destructive/40 px-4 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            <Trash2Icon className="size-4" /> Delete
          </button>
        )}
      </div>
    </form>
  );
}
