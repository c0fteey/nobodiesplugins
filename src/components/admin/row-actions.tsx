"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, Loader2Icon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { setMessageHandledAction, setUserRoleAction } from "@/actions/admin";
import { admin } from "@/lang/admin";
import { ChoiceSelect } from "@/components/ui/choice-select";

export function RoleSelect({
  userId,
  role,
  roles,
  disabled,
}: {
  userId: string;
  role: string;
  roles: { key: string; name: string; color: string }[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // Shown optimistically; snaps back if the server refuses
  const [value, setValue] = useState(role);

  const change = (next: string) => {
    setValue(next);
    start(async () => {
      const result = await setUserRoleAction({ userId, role: next });
      if (!result.ok) {
        setValue(role);
        return void toast.error(result.error);
      }
      toast.success(admin.users.roleSet(roles.find((r) => r.key === next)?.name ?? next));
      router.refresh();
    });
  };

  return (
    <span className="inline-flex items-center gap-2">
      <ChoiceSelect
        value={value}
        onChange={change}
        disabled={disabled || pending}
        title={disabled ? admin.users.ownRole : undefined}
        aria-label={admin.users.columns.role}
        options={roles.map((r) => ({ value: r.key, label: r.name, color: r.color }))}
        className="h-8 w-44 rounded-md border-white/10 bg-[#0f0f0f] px-2.5 text-xs dark:bg-[#0f0f0f] disabled:opacity-50"
      />
      {pending && <Loader2Icon className="size-3.5 animate-spin text-white/60" />}
    </span>
  );
}

export function HandledButton({ id, handled }: { id: string; handled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await setMessageHandledAction({ id, handled: !handled });
          if (!result.ok) return void toast.error(result.error);
          router.refresh();
        })
      }
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 px-3 text-xs font-semibold transition hover:bg-white/5"
    >
      {pending ? <Loader2Icon className="size-3.5 animate-spin" /> : handled ? <RotateCcwIcon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
      {handled ? admin.messages.reopen : admin.messages.markHandled}
    </button>
  );
}
