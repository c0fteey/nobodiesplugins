import type { Metadata } from "next";
import Link from "next/link";
import { getAllDocs, getAllProducts } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { AdminCard, AdminHeader, StatusPill, td, th } from "@/components/admin/ui";
import { admin } from "@/lang/admin";

const t = admin.docs;

export const metadata: Metadata = { title: admin.meta.docs + admin.meta.suffix };

export default async function AdminDocsPage() {
  const [docs, products] = await Promise.all([getAllDocs(), getAllProducts()]);
  const productName = new Map(products.map((p) => [p.id, p.name]));

  return (
    <>
      <AdminHeader
        title={t.title}
        description={t.description}
        action={{ href: "/admin/docs/new", label: t.newPage }}
      />
      <AdminCard className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-white/5">
            <tr><th className={th}>{t.columns.title}</th><th className={th}>{t.columns.product}</th><th className={th}>{t.columns.status}</th><th className={th}>{t.columns.updated}</th></tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className={td}>
                  <Link href={`/admin/docs/${d.id}`} className="font-semibold hover:text-brand-soft">{d.title}</Link>
                  <span className="block text-xs text-white/50">/docs/{d.slug}</span>
                </td>
                <td className={`${td} text-white/70`}>{d.productId ? productName.get(d.productId) : admin.common.resources}</td>
                <td className={td}><StatusPill on={d.published} onLabel={admin.common.published} offLabel={admin.common.draft} /></td>
                <td className={`${td} text-white/60`}>{formatDate(d.updatedAt)}</td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr><td className={`${td} text-white/50`} colSpan={4}>{t.empty}</td></tr>
            )}
          </tbody>
        </table>
      </AdminCard>
    </>
  );
}
