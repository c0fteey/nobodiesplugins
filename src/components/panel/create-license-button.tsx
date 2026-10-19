"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRoundIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { createMyLicenseAction } from "@/actions/account";
import { cn } from "@/lib/utils";
import { site } from "@/lang/site";

/** Shown instead of "Download" for an owned plugin that has no license key yet. */
export function CreateLicenseButton({ productId, className, label = site.licenses.create }: { productId: string; className?: string; label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      title={site.licenses.needsKey}
      onClick={() =>
        start(async () => {
          const result = await createMyLicenseAction(productId);
          if (!result.ok) return void toast.error(result.error);
          toast.success(result.message);
          router.refresh();
        })
      }
      className={cn("flex items-center justify-center gap-2 font-semibold transition disabled:opacity-60", className)}
    >
      {pending ? <Loader2Icon className="size-4 animate-spin" /> : <KeyRoundIcon className="size-4" />} {label}
    </button>
  );
}
