import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-guard";
import { CartButton } from "./cart-button";
import { UserAvatar } from "./user-avatar";

/** "Hello, name!" bar. Reads the session, so it renders behind <Suspense>. */
export async function PanelHeader({ badge }: { badge?: string }) {
  const user = await getCurrentUser();
  const name = user?.name || user?.email?.split("@")[0] || "there";

  return (
    <div className="flex h-[120px] items-center gap-4 border-b border-white/5 px-6 sm:px-14">
      <ChevronRightIcon className="size-5 text-white/80" />
      <h1 className="truncate text-xl font-bold sm:text-2xl">Hello, {name}!</h1>
      {badge && <span className="rounded-md bg-brand/20 px-2 py-0.5 text-xs font-semibold text-brand-soft">{badge}</span>}
      <div className="ml-auto flex items-center gap-6">
        <CartButton />
        <Link href="/dashboard/settings" aria-label="Account settings">
          <UserAvatar name={name} image={user?.image ?? null} />
        </Link>
      </div>
    </div>
  );
}

export function PanelHeaderFallback() {
  return <div className="h-[120px] border-b border-white/5" />;
}
