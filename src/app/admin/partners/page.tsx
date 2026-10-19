import type { Metadata } from "next";
import { getAllPartners } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { PartnerEditor } from "@/components/admin/list-editors";
import { admin } from "@/lang/admin";

export const metadata: Metadata = { title: admin.meta.partners + admin.meta.suffix };

export default async function AdminPartnersPage() {
  const partners = await getAllPartners();
  return (
    <>
      <AdminHeader title={admin.partners.title} description={admin.partners.description} />
      <div className="max-w-3xl">
        <PartnerEditor partners={partners} />
      </div>
    </>
  );
}
