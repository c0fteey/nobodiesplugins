import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth-guard";
import { getPurchases } from "@/lib/data/account";
import { PurchasesGrid } from "@/components/panel/purchases-grid";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "My purchases" };

export default function PurchasesPage() {
  return (
    <>
      <h2 className="text-xl text-white/60">My Purchases</h2>
      <Suspense fallback={<Skeleton className="mt-8 h-[500px] rounded-xl" />}>
        <Purchases />
      </Suspense>
    </>
  );
}

async function Purchases() {
  const user = await requireUser();
  const rows = await getPurchases(user.id);
  // Dates are serialized to the client grid as ISO strings
  const purchases = rows.map((r) => ({ product: r.product, acquiredAt: r.acquiredAt.toISOString() }));
  return <PurchasesGrid purchases={purchases} />;
}
