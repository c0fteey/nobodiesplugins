"use client";

import { useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { discordSignInAction } from "@/actions/discord";
import { DiscordIcon } from "@/components/brand/icons";
import { oauthButtonCls } from "./google-button";

export function DiscordButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={label}
      onClick={() => startTransition(() => discordSignInAction())}
      className={`${oauthButtonCls} bg-[#5865f2] text-white hover:bg-[#4752c4]`}
    >
      {pending ? <Loader2Icon className="size-4 animate-spin" /> : <DiscordIcon className="size-[18px]" />} Discord
    </button>
  );
}
