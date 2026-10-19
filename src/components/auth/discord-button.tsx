"use client";

import { useTransition } from "react";
import { discordSignInAction } from "@/actions/discord";
import { DiscordIcon } from "@/components/brand/icons";

export function DiscordButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => discordSignInAction())}
      className="flex h-[52px] w-full items-center justify-center gap-4 rounded-md bg-[#5865f2] text-base font-semibold text-white shadow-sm transition hover:bg-[#4752c4] disabled:opacity-70"
    >
      <DiscordIcon className="size-5" /> {label}
    </button>
  );
}
