import type { Metadata } from "next";
import Link from "next/link";
import { getAllDocs, getAllProducts } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { AdminCard, AdminHeader, StatusPill, td, th } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Docs · Admin" };

export default async function AdminDocsPage() {
  const [docs, products] = await Promise.all([getAllDocs(), getAllProducts()]);
  const productName = new Map(products.map((p) => [p.id, p.name]));

  return (
    <>
      <AdminHeader
        title="Documentation"
        description="Pages linked to a plugin appear under it on /docs; unlinked pages show up as Resources."
        action={{ href: "/admin/docs/new", label: "New page" }}
      />
      <AdminCard className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-white/5">
            <tr><th className={th}>TITLE</th><th className={th}>PRODUCT</th><th className={th}>STATUS</th><th className={th}>UPDATED</th></tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className={td}>
                  <Link href={`/admin/docs/${d.id}`} className="font-semibold hover:text-brand-soft">{d.title}</Link>
                  <span className="block text-xs text-white/50">/docs/{d.slug}</span>
                </td>
                <td className={`${td} text-white/70`}>{d.productId ? productName.get(d.productId) : "Resources"}</td>
                <td className={td}><StatusPill on={d.published} onLabel="Published" offLabel="Draft" /></td>
                <td className={`${td} text-white/60`}>{formatDate(d.updatedAt)}</td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr><td className={`${td} text-white/50`} colSpan={4}>No pages yet.</td></tr>
            )}
          </tbody>
        </table>
      </AdminCard>
    </>
  );
}
