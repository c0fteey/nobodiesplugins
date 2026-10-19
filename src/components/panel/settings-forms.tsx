"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, LockIcon } from "lucide-react";
import { toast } from "sonner";
import { changePasswordAction, updatePreferencesAction, updateProfileAction, type AccountResult } from "@/actions/account";
import { removeAvatarAction, saveAvatarAction, type AvatarResult } from "@/actions/upload";
import { ImageUploadButton } from "@/components/media/image-upload";
import { uploadHint } from "@/lib/upload-limits";
import { Switch } from "@/components/ui/switch";
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordInput,
  type ProfileInput,
} from "@/lib/validations/auth";
import { UserAvatar } from "./user-avatar";
import { site } from "@/lang/site";

const t = site.settings;

const label = "mb-3 block text-[11px] font-bold tracking-[0.18em] text-white/60";
const input =
  "h-11 w-full rounded-sm bg-[#0b0b0b] px-4 text-sm outline-none ring-1 ring-transparent transition placeholder:text-white/30 focus:ring-brand aria-invalid:ring-destructive";
const primary =
  "inline-flex h-10 items-center gap-2 rounded-sm bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand/85 disabled:opacity-60";

function toastResult(result: AccountResult) {
  if (result.ok) toast.success(result.message);
  else toast.error(result.error);
}

function AvatarPicker({ name, image: initial }: { name: string; image: string | null }) {
  const [image, setImage] = useState(initial);
  const [removing, startRemove] = useTransition();

  const apply = (result: AvatarResult, message: string) => {
    if (!result.ok) return void toast.error(result.error);
    setImage(result.image);
    toast.success(message);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <UserAvatar name={name} image={image} className="size-24 rounded-md border-0 text-2xl" />
      <ImageUploadButton
        kind="avatar"
        label={t.uploadPhoto}
        className="h-8 px-2.5 text-xs"
        onUploaded={async (url) => apply(await saveAvatarAction(url), t.photoUpdated)}
      />
      {image ? (
        <button
          type="button"
          disabled={removing}
          onClick={() => startRemove(async () => apply(await removeAvatarAction(), t.photoRemoved))}
          className="text-[11px] text-white/50 hover:text-destructive"
        >
          {t.removePhoto}
        </button>
      ) : (
        <span className="text-[11px] text-white/50">{uploadHint("avatar")}</span>
      )}
    </div>
  );
}

export function ProfileForm({ name, email, image }: { name: string; email: string; image: string | null }) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, control, formState: { errors } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, email },
  });
  const liveName = useWatch({ control, name: "name" });

  return (
    <form
      onSubmit={handleSubmit((values) => startTransition(async () => toastResult(await updateProfileAction(values))))}
      noValidate
      className="flex flex-col gap-8 md:flex-row"
    >
      <AvatarPicker name={liveName || email} image={image} />
      <div className="flex-1">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="name" className={label}>{t.fullName}</label>
            <input id="name" {...register("name")} aria-invalid={!!errors.name} className={input} />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className={label}>{t.emailAddress}</label>
            <input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} className={input} />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={pending} className={primary}>
            {pending && <Loader2Icon className="size-4 animate-spin" />} {t.saveChanges}
          </button>
        </div>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const result = await changePasswordAction(values);
          toastResult(result);
          if (result.ok) reset();
        }),
      )}
    >
      <label htmlFor="currentPassword" className={label}>{t.currentPassword}</label>
      <input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} aria-invalid={!!errors.currentPassword} className={`${input} md:w-[60%]`} />
      {errors.currentPassword && <p className="mt-1 text-xs text-destructive">{errors.currentPassword.message}</p>}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="newPassword" className={label}>{t.newPassword}</label>
          <input id="newPassword" type="password" autoComplete="new-password" placeholder={t.newPasswordPlaceholder} {...register("newPassword")} aria-invalid={!!errors.newPassword} className={input} />
          {errors.newPassword && <p className="mt-1 text-xs text-destructive">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className={label}>{t.confirmNewPassword}</label>
          <input id="confirmPassword" type="password" autoComplete="new-password" placeholder={t.confirmPlaceholder} {...register("confirmPassword")} aria-invalid={!!errors.confirmPassword} className={input} />
          {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>
      </div>
      <button type="submit" disabled={pending} className={`${primary} mt-6`}>
        {pending ? <Loader2Icon className="size-4 animate-spin" /> : null} {t.updatePassword} <LockIcon className="size-4" />
      </button>
    </form>
  );
}

export function PreferencesForm({ marketingEmails }: { marketingEmails: boolean }) {
  const [enabled, setEnabled] = useState(marketingEmails);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <h2 className="text-[11px] font-bold tracking-[0.18em] text-white/60">{t.emailPrefs}</h2>
      <div className="mt-8 flex items-start justify-between gap-6 rounded-xl border border-white/5 bg-[#141414] p-5">
        <div>
          <p className="font-bold">{t.marketing}</p>
          <p className="mt-1 text-sm text-white/60">
            {t.marketingText}
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(v) => setEnabled(v)}
          aria-label={t.marketing}
          className="data-checked:bg-brand"
        />
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => toastResult(await updatePreferencesAction({ marketingEmails: enabled })))}
        className={`${primary} mt-6`}
      >
        {pending && <Loader2Icon className="size-4 animate-spin" />} {t.savePrefs}
      </button>
    </div>
  );
}
