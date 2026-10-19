"use client";

import { useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { googleSignInAction } from "@/actions/auth";
import { GoogleIcon } from "@/components/brand/icons";

export const oauthButtonCls =
  "flex h-11 w-full items-center justify-center gap-2.5 rounded-lg text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-70";

export function GoogleButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={label}
      onClick={() => startTransition(() => googleSignInAction())}
      className={`${oauthButtonCls} bg-white text-[#1f1f1f] hover:bg-white/90`}
    >
      {pending ? <Loader2Icon className="size-4 animate-spin" /> : <GoogleIcon className="size-[18px]" />} Google
    </button>
  );
}
