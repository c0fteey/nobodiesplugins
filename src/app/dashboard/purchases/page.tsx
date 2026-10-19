import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth-guard";
import { getLicenses, getPurchases } from "@/lib/data/account";
import { PurchasesGrid } from "@/components/panel/purchases-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { site } from "@/lang/site";

export const metadata: Metadata = { title: site.meta.pages.purchases };

export default function PurchasesPage() {
  return (
    <>
      <h2 className="text-xl text-white/60">{site.purchases.title}</h2>
      <Suspense fallback={<Skeleton className="mt-8 h-[500px] rounded-xl" />}>
        <Purchases />
      </Suspense>
    </>
  );
}

async function Purchases() {
  const user = await requireUser();
  const [rows, licenses] = await Promise.all([getPurchases(user.id), getLicenses(user.id)]);
  // Dates are serialized to the client grid as ISO strings
  const purchases = rows.map((r) => ({ product: r.product, acquiredAt: r.acquiredAt.toISOString() }));
  return <PurchasesGrid purchases={purchases} licensedIds={licenses.map((l) => l.license.productId)} />;
}
