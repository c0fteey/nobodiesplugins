"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { Campaign } from "@/db/schema";
import { deleteCampaignAction, saveCampaignAction } from "@/actions/admin";
import { campaignSchema } from "@/lib/validations/store";
import { formatPrice, toDateTimeLocal } from "@/lib/format";
import { Field, inputCls, Section, selectCls, Toggle } from "./form-bits";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { admin } from "@/lang/admin";

const t = admin.campaigns.form;

type FormIn = z.input<typeof campaignSchema>;
type FormOut = z.output<typeof campaignSchema>;
type ProductOption = { id: string; name: string; priceCents: number };

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

export function CampaignForm({ campaign, products }: { campaign: Campaign | null; products: ProductOption[] }) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      id: campaign?.id,
      name: campaign?.name ?? "",
      label: campaign?.label ?? t.defaultBadge,
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
          toast.success(campaign ? t.updated : t.created);
          // Next keeps visited pages mounted (Activity), so "new campaign" would reopen with this draft
          if (!campaign) reset();
          router.push("/admin/campaigns");
        }),
      )}
      className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]"
    >
      <div className="grid content-start gap-6">
        <Section title={t.sections.offer}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t.trigger} error={errors.triggerProductId?.message}>
              <Controller
                control={control}
                name="triggerProductId"
                render={({ field }) => (
                  <ChoiceSelect
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    options={products.map((p) => ({ value: p.id, label: p.name }))}
                    placeholder={admin.common.chooseProduct}
                    aria-label={t.trigger}
                    aria-invalid={!!errors.triggerProductId}
                    className={selectCls}
                  />
                )}
              />
            </Field>
            <Field label={t.reward} error={errors.rewardProductId?.message}>
              <Controller
                control={control}
                name="rewardProductId"
                render={({ field }) => (
                  <ChoiceSelect
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    options={products.map((p) => ({ value: p.id, label: p.name, hint: formatPrice(p.priceCents), disabled: p.id === v.triggerProductId }))}
                    placeholder={admin.common.chooseProduct}
                    aria-label={t.reward}
                    aria-invalid={!!errors.rewardProductId}
                    className={selectCls}
                  />
                )}
              />
            </Field>
          </div>
        </Section>

        <Section title={t.sections.copy}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t.name} error={errors.name?.message}>
              <input {...register("name")} placeholder={t.namePlaceholder} className={inputCls} />
            </Field>
            <Field label={t.badge} error={errors.label?.message}>
              <input {...register("label")} className={`${inputCls} uppercase`} />
            </Field>
          </div>
          <Field label={t.headline} error={errors.headline?.message}>
            <input {...register("headline")} placeholder={t.headlinePlaceholder} className={inputCls} />
          </Field>
          <Field label={t.smallText} hint={t.smallTextHint} error={errors.text?.message}>
            <input {...register("text")} className={inputCls} />
          </Field>
        </Section>

        <Section title={t.sections.schedule}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t.starts} hint={t.startsHint} error={errors.startsAt?.message}>
              <Controller
                control={control}
                name="startsAt"
                render={({ field }) => <DatePickerField value={field.value} onChange={field.onChange} invalid={!!errors.startsAt} />}
              />
            </Field>
            <Field label={t.ends} hint={t.endsHint} error={errors.endsAt?.message}>
              <Controller
                control={control}
                name="endsAt"
                render={({ field }) => <DatePickerField value={field.value} onChange={field.onChange} invalid={!!errors.endsAt} />}
              />
            </Field>
          </div>
          <Toggle label={admin.common.active} control={control} name="active" />
        </Section>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex h-11 w-48 items-center justify-center gap-2 rounded-md bg-brand font-semibold text-white transition hover:bg-brand/85 disabled:opacity-60">
            {saving && <Loader2Icon className="size-4 animate-spin" />} {campaign ? t.save : t.create}
          </button>
          {campaign && (
            <button
              type="button"
              disabled={deleting}
              onClick={async () => {
                if (!(await confirmDialog({ title: admin.common.deleteConfirm(campaign.name), confirmLabel: admin.common.delete }))) return;
                startDelete(async () => {
                  const result = await deleteCampaignAction(campaign.id);
                  if (!result.ok) return void toast.error(result.error);
                  toast.success(t.deleted);
                  router.push("/admin/campaigns");
                });
              }}
              className="flex h-11 items-center gap-2 rounded-md border border-destructive/40 px-4 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2Icon className="size-4" /> {admin.common.delete}
            </button>
          )}
        </div>
      </div>

      {/* Live preview of the card shown on the product page */}
      <aside className="h-fit xl:sticky xl:top-6">
        <p className="mb-3 text-xs font-bold tracking-[0.14em] text-white/50">{t.previewOn(trigger?.name?.toLocaleUpperCase("tr-TR") ?? t.previewProduct)}</p>
        <div className="rounded-2xl border border-success/40 bg-[linear-gradient(100deg,#2b1d3d_0%,#1d2530_55%,#13301f_100%)] p-6">
          <span className="inline-block rounded-full bg-success px-3 py-0.5 text-xs font-extrabold text-[#062b14] uppercase">{v.label || t.defaultBadge}</span>
          <p className="mt-3 text-lg font-bold">{v.headline || t.previewHeadline}</p>
          <p className="mt-1 text-sm text-white/70">
            {v.text ||
              (reward && trigger
                ? t.previewDefault(formatPrice(reward.priceCents), trigger.name)
                : t.previewChoose)}
          </p>
          {v.endsAt && <p className="mt-4 text-xs font-bold tracking-wide text-white/60">{t.previewCountdown}</p>}
        </div>
      </aside>
    </form>
  );
}
