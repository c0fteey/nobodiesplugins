import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProducts, getCouponById } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/coupon-form";
import { admin } from "@/lang/admin";

export const metadata: Metadata = { title: admin.meta.editCoupon + admin.meta.suffix };

export default async function EditCouponPage({ params }: PageProps<"/admin/coupons/[id]">) {
  const { id } = await params;
  const isNew = id === "new";
  const [row, products] = await Promise.all([isNew ? null : getCouponById(id), getAllProducts()]);
  if (!isNew && !row) notFound();

  return (
    <>
      <AdminHeader title={isNew ? admin.coupons.newTitle : admin.common.editTitle(row!.coupon.code)} />
      <CouponForm
        coupon={row?.coupon ?? null}
        ownerEmail={row?.ownerEmail ?? ""}
        products={products.map((p) => ({ id: p.id, name: p.name, type: p.type }))}
      />
    </>
  );
}
