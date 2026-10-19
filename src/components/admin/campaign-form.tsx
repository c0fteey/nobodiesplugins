"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { Campaign } from "@/db/schema";
import { deleteCampaignAction, saveCampaignAction } from "@/actions/admin";
import { campaignSchema } from "@/lib/validations/store";
import { formatPrice, toDateTimeLocal } from "@/lib/format";
import { Field, inputCls, Section, Toggle } from "./form-bits";

type FormIn = z.input<typeof campaignSchema>;
type FormOut = z.output<typeof campaignSchema>;
type ProductOption = { id: string; name: string; priceCents: number };

export function CampaignForm({ campaign, products }: { campaign: Campaign | null; products: ProductOption[] }) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      id: campaign?.id,
      name: campaign?.name ?? "",
      label: campaign?.label ?? "LAUNCH OFFER",
      headline: campaign?.headline ?? "",
      text: campaign?.text ?? "",
      triggerProductId: campaign?.triggerProductId ?? "",
      rewardProductId: campaign?.rewardProductId ?? "",
      startsAt: toDateTimeLocal(campaign?.startsAt),
      endsAt: toDateTimeLocal(campaign?.endsAt),
      active: campaign?.active ?? true,
    },
  });
  const v = useWatch({ control });
  const trigger = products.find((p) => p.id === v.triggerProductId);
  const reward = products.find((p) => p.id === v.rewardProductId);

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        startSave(async () => {
          const result = await saveCampaignAction(values);
          if (!result.ok) return void toast.error(result.error);
          toast.success(campaign ? "Campaign updated" : "Campaign created");
          router.push("/admin/campaigns");
        }),
      )}
      className="grid gap-6 xl:grid-cols-[1fr_420px]"
    >
      <div className="grid content-start gap-6">
        <Section title="Offer">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="When someone buys" error={errors.triggerProductId?.message}>
              <select {...register("triggerProductId")} className={inputCls}>
                <option value="">Choose a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field label="…they also get for free" error={errors.rewardProductId?.message}>
              <select {...register("rewardProductId")} className={inputCls}>
                <option value="">Choose a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({formatPrice(p.priceCents)})</option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Copy">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Internal name" error={errors.name?.message}>
              <input {...register("name")} placeholder="Shop launch" className={inputCls} />
            </Field>
            <Field label="Badge" error={errors.label?.message}>
              <input {...register("label")} className={`${inputCls} uppercase`} />
            </Field>
          </div>
          <Field label="Headline" error={errors.headline?.message}>
            <input {...register("headline")} placeholder="Buy now and get the AutoSell add-on free" className={inputCls} />
          </Field>
          <Field label="Small text" hint="Empty = “Worth €x. It is added to your account automatically…”" error={errors.text?.message}>
            <input {...register("text")} className={inputCls} />
          </Field>
        </Section>

        <Section title="Schedule">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Starts" hint="Empty = immediately" error={errors.startsAt?.message}>
              <input type="datetime-local" {...register("startsAt")} className={inputCls} />
            </Field>
            <Field label="Ends" hint="Shows the countdown; empty = no end" error={errors.endsAt?.message}>
              <input type="datetime-local" {...register("endsAt")} className={inputCls} />
            </Field>
          </div>
          <Toggle label="Active" {...register("active")} />
        </Section>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex h-11 w-48 items-center justify-center gap-2 rounded-md bg-brand font-semibold text-white transition hover:bg-brand/85 disabled:opacity-60">
            {saving && <Loader2Icon className="size-4 animate-spin" />} {campaign ? "Save campaign" : "Create campaign"}
          </button>
          {campaign && (
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                if (!confirm(`Delete "${campaign.name}"?`)) return;
                startDelete(async () => {
                  const result = await deleteCampaignAction(campaign.id);
                  if (!result.ok) return void toast.error(result.error);
                  toast.success("Campaign deleted");
                  router.push("/admin/campaigns");
                });
              }}
              className="flex h-11 items-center gap-2 rounded-md border border-destructive/40 px-4 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2Icon className="size-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Live preview of the card shown on the product page */}
      <aside className="h-fit xl:sticky xl:top-6">
        <p className="mb-3 text-xs font-bold tracking-[0.14em] text-white/50">PREVIEW ON {trigger?.name?.toUpperCase() ?? "PRODUCT"} PAGE</p>
        <div className="rounded-2xl border border-success/40 bg-[linear-gradient(100deg,#2b1d3d_0%,#1d2530_55%,#13301f_100%)] p-6">
          <span className="inline-block rounded-full bg-success px-3 py-0.5 text-xs font-extrabold text-[#062b14] uppercase">{v.label || "LAUNCH OFFER"}</span>
          <p className="mt-3 text-lg font-bold">{v.headline || "Headline"}</p>
          <p className="mt-1 text-sm text-white/70">
            {v.text ||
              (reward && trigger
                ? `Worth ${formatPrice(reward.priceCents)}. It is added to your account automatically when you buy ${trigger.name}.`
                : "Choose both products to see the text.")}
          </p>
          {v.endsAt && <p className="mt-4 text-xs font-bold tracking-wide text-white/60">+ OFFER ENDS IN countdown</p>}
        </div>
      </aside>
    </form>
  );
}
