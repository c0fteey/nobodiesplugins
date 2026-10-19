"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, Loader2Icon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { setMessageHandledAction, setUserRoleAction } from "@/actions/admin";

export function RoleSelect({ userId, role, disabled }: { userId: string; role: "user" | "admin"; disabled?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <span className="inline-flex items-center gap-2">
      <select
        defaultValue={role}
        disabled={disabled || pending}
        title={disabled ? "You can't change your own role" : undefined}
        onChange={(e) => {
          const next = e.target.value as "user" | "admin";
          start(async () => {
            const result = await setUserRoleAction({ userId, role: next });
            if (!result.ok) {
              e.target.value = role;
              return void toast.error(result.error);
            }
            toast.success(`Role set to ${next}`);
            router.refresh();
          });
        }}
        className="h-8 rounded-md border border-white/10 bg-[#0f0f0f] px-2 text-xs outline-none focus:border-brand disabled:opacity-50"
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
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
      {handled ? "Reopen" : "Mark handled"}
    </button>
  );
}
