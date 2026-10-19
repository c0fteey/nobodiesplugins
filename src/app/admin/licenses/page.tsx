import type { Metadata } from "next";
import { getAllLicenses } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { LicensesAdmin } from "@/components/admin/licenses-admin";
import { admin } from "@/lang/admin";

export const metadata: Metadata = { title: admin.meta.licenses + admin.meta.suffix };

export default async function AdminLicensesPage() {
  const rows = await getAllLicenses();
  return (
    <>
      <AdminHeader title={admin.licenses.title} description={admin.licenses.description} />
      <LicensesAdmin
        rows={rows.map(({ license: l, productName, email }) => ({
          id: l.id,
          key: l.key,
          status: l.status,
          activations: l.activations,
          lastSeenAt: l.lastSeenAt?.toISOString() ?? null,
          lastServer: l.lastServer,
          productName,
          email,
        }))}
      />
    </>
  );
}
