"use client";

import { useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { connectDiscordAction, disconnectDiscordAction, resyncMyDiscordAction, type DiscordResult } from "@/actions/discord";
import { DiscordIcon } from "@/components/brand/icons";
import { site } from "@/lang/site";

const t = site.discord;

const LINK_ERRORS: Record<string, string> = t.linkErrors;

export function DiscordCard({ available, username }: { available: boolean; username: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  // Coming back from the Discord OAuth screen
  const status = params.get("discord");
  useEffect(() => {
    if (!status) return;
    if (status === "linked") toast.success(t.linked);
    else toast.error(LINK_ERRORS[status] ?? t.linkFailed);
    router.replace("/dashboard/settings", { scroll: false });
  }, [status, router]);

  const run = (fn: () => Promise<DiscordResult>) =>
    start(async () => {
      const result = await fn();
      if (result.ok) toast.success(result.message);
      else toast.error(result.error);
      router.refresh();
    });

  const button = "inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="grid size-12 place-items-center rounded-md bg-[#5865f2]">
        <DiscordIcon className="size-7 text-white" />
      </span>
      <div className="min-w-0">
        <p className="font-bold">{t.title}</p>
        <p className="text-xs text-white/60">
          {username ? (
            <>{t.connectedAs}<span className="font-semibold text-white">{username}</span>{t.connectedSuffix}</>
          ) : (
            t.linkText
          )}
        </p>
      </div>
      <div className="ml-auto flex gap-2">
        {!available ? (
          <span className="rounded-md border border-white/10 bg-[#141414] px-5 py-2 text-sm font-semibold text-white/50">{t.comingSoon}</span>
        ) : username ? (
          <>
            <button type="button" disabled={pending} onClick={() => run(resyncMyDiscordAction)} className={`${button} border border-white/10 hover:border-white/30`}>
              {pending ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />} {t.syncRoles}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => confirm(t.disconnectConfirm) && run(disconnectDiscordAction)}
              className={`${button} text-white/60 hover:text-destructive`}
            >
              {t.disconnect}
            </button>
          </>
        ) : (
          <button type="button" disabled={pending} onClick={() => start(() => connectDiscordAction())} className={`${button} bg-[#5865f2] text-white hover:bg-[#4752c4]`}>
            {pending && <Loader2Icon className="size-4 animate-spin" />} {t.connect}
          </button>
        )}
      </div>
    </div>
  );
}
