"use client";

import { useTransition } from "react";
import { googleSignInAction } from "@/actions/auth";
import { GoogleIcon } from "@/components/brand/icons";

export function GoogleButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => googleSignInAction())}
      className="flex h-[52px] w-full items-center justify-center gap-4 rounded-md border border-black/10 bg-white text-base text-[#555] shadow-sm transition hover:bg-white/90 disabled:opacity-70"
    >
      <GoogleIcon className="size-5" /> {label}
    </button>
  );
}
