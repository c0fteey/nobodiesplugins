import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-guard";
import { CartButton } from "./cart-button";
import { UserAvatar } from "./user-avatar";
import { site } from "@/lang/site";

/** "Hello, name!" bar. Reads the session, so it renders behind <Suspense>. */
export async function PanelHeader({ badge }: { badge?: string }) {
  const user = await getCurrentUser();
  const name = user?.name || user?.email?.split("@")[0] || site.panel.there;

  return (
    <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4 md:h-[120px] md:gap-4 md:px-8 xl:px-14">
      <ChevronRightIcon className="hidden size-5 shrink-0 text-white/80 md:block" />
      <h1 className="min-w-0 truncate text-base font-bold sm:text-xl md:text-2xl">{site.panel.hello(name)}</h1>
      {badge && <span className="shrink-0 rounded-md bg-brand/20 px-2 py-0.5 text-xs font-semibold text-brand-soft">{badge}</span>}
      <div className="ml-auto flex shrink-0 items-center gap-4 md:gap-6">
        <CartButton />
        <Link href="/dashboard/settings" aria-label={site.panel.accountSettings}>
          <UserAvatar name={name} image={user?.image ?? null} />
        </Link>
      </div>
    </div>
  );
}

export function PanelHeaderFallback() {
  return <div className="h-16 border-b border-white/5 md:h-[120px]" />;
}
