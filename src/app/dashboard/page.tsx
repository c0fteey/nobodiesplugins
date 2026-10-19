import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth-guard";
import { getAccountCoupons, getLicenses, getOwnedProductIds } from "@/lib/data/account";
import { getProducts, getSettings } from "@/lib/data/store";
import { BundleCard, PluginPanelCard } from "@/components/panel/dashboard-cards";
import { AccountCoupons } from "@/components/panel/account-coupons";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardHome() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const user = await requireUser();
  const [products, owned, licenses, settings, coupons] = await Promise.all([
    getProducts(),
    getOwnedProductIds(user.id),
    getLicenses(user.id),
    getSettings(),
    getAccountCoupons(user.id),
  ]);

  const plugins = products.filter((p) => p.type === "plugin");
  const addonsOf = (id: string) => products.filter((p) => p.parentId === id);

  // Promote the first plugin the user hasn't completed yet
  const bundlePlugin =
    plugins.find((p) => !owned.has(p.id) || addonsOf(p.id).some((a) => a.priceCents > 0 && !owned.has(a.id))) ??
    plugins[0];
  const bundleItems = bundlePlugin
    ? [bundlePlugin, ...addonsOf(bundlePlugin.id).filter((a) => a.priceCents > 0)].filter((p) => !owned.has(p.id))
    : [];

  const activeLicenses = licenses.filter((l) => l.license.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {bundlePlugin && bundleItems.length > 0 ? (
          <BundleCard plugin={bundlePlugin} items={bundleItems} />
        ) : (
          <div className="rounded-xl border border-white/5 bg-[#1b1a26] p-10">
            <p className="text-3xl font-bold">You own the whole collection 🎉</p>
            <p className="mt-3 text-white/70">New plugins and add-ons will show up here as soon as they launch.</p>
          </div>
        )}

        <div className="rounded-xl border border-white/5 bg-[#171717] p-8">
          <h2 className="text-xl font-bold">Account Overview</h2>
          <p className="mt-2 text-sm text-white/60">Overview of your active licenses and usage.</p>
          <ul className="mt-6 divide-y divide-white/5 text-sm">
            <li className="flex items-center justify-between py-4">
              <span className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-brand-soft" /> Total Purchases</span>
              <span className="font-bold">{owned.size}</span>
            </li>
            <li className="flex items-center justify-between py-4">
              <span className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-brand-soft" /> Active Licenses</span>
              <span className="font-mono font-bold">{activeLicenses}</span>
            </li>
          </ul>
          <div className="mt-6 flex items-center gap-4 rounded-lg bg-[#1e1e1e] p-4">
            <span className="grid size-10 place-items-center rounded-md bg-brand/20 text-brand-soft">★</span>
            <span>
              <span className="block text-xs text-white/60">Account Tier</span>
              <span className="font-bold text-brand-soft">{user.role === "admin" ? "Administrator" : owned.size > 0 ? "Premium Member" : "Member"}</span>
            </span>
          </div>
        </div>
      </div>

      <AccountCoupons coupons={coupons} />

      <div className="grid gap-6 lg:grid-cols-2">
        {plugins.map((plugin) => (
          <PluginPanelCard
            key={plugin.id}
            plugin={plugin}
            addons={addonsOf(plugin.id)}
            ownedIds={[...owned].filter((id) => id === plugin.id || addonsOf(plugin.id).some((a) => a.id === id))}
            seasonLabel={settings.seasonLabel}
          />
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-[380px] rounded-xl" />
        <Skeleton className="h-[380px] rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[640px] rounded-xl" />
        <Skeleton className="h-[640px] rounded-xl" />
      </div>
    </div>
  );
}
