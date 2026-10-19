import type { Metadata } from "next";
import Link from "next/link";
import { getAllProducts } from "@/lib/data/admin";
import { formatPrice, PRODUCT_TYPE_LABEL } from "@/lib/format";
import { AdminCard, AdminHeader, StatusPill, td, th } from "@/components/admin/ui";
import { ProductArt } from "@/components/store/product-art";

export const metadata: Metadata = { title: "Products · Admin" };

export default async function AdminProductsPage() {
  const products = await getAllProducts();
  const parentName = new Map(products.map((p) => [p.id, p.name]));

  return (
    <>
      <AdminHeader
        title="Products"
        description="Plugins, add-ons, models and builds. Changes show up on the store instantly."
        action={{ href: "/admin/products/new", label: "New product" }}
      />
      <AdminCard className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-white/5">
            <tr>
              <th className={th}>PRODUCT</th>
              <th className={th}>TYPE</th>
              <th className={th}>PRICE</th>
              <th className={th}>STATUS</th>
              <th className={th}>ORDER</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.02]">
                <td className={td}>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                    <ProductArt product={p} size="sm" sizes="48px" className="size-12 shrink-0 rounded" />
                    <span>
                      <span className="block font-semibold hover:text-brand-soft">{p.name}</span>
                      <span className="text-xs text-white/50">
                        /{p.slug}
                        {p.parentId && ` · for ${parentName.get(p.parentId) ?? "?"}`}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className={td}>{PRODUCT_TYPE_LABEL[p.type]}</td>
                <td className={td}>
                  {p.compareAtCents && <s className="mr-2 text-white/40">{formatPrice(p.compareAtCents)}</s>}
                  <span className="font-semibold">{p.priceCents ? formatPrice(p.priceCents) : "Free"}</span>
                </td>
                <td className={`${td} space-x-1.5`}>
                  <StatusPill on={p.published} onLabel="Published" offLabel="Draft" />
                  {p.featured && <StatusPill on onLabel="Featured" offLabel="" />}
                </td>
                <td className={`${td} text-white/60`}>{p.sortOrder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminCard>
    </>
  );
}
