import type { Metadata } from "next";
import { getRolesWithCounts } from "@/lib/data/roles";
import { AdminHeader } from "@/components/admin/ui";
import { RolesEditor } from "@/components/admin/roles-editor";
import { admin } from "@/lang/admin";

export const metadata: Metadata = { title: admin.meta.roles + admin.meta.suffix };

export default async function AdminRolesPage() {
  const rows = await getRolesWithCounts();
  return (
    <>
      <AdminHeader title={admin.roles.title} description={admin.roles.description} />
      <div className="max-w-4xl">
        <RolesEditor rows={rows} />
      </div>
    </>
  );
}
