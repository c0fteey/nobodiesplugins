import type { Metadata } from "next";
import { getAllPartners } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { PartnerEditor } from "@/components/admin/list-editors";

export const metadata: Metadata = { title: "Partner servers · Admin" };

export default async function AdminPartnersPage() {
  const partners = await getAllPartners();
  return (
    <>
      <AdminHeader title="Partner servers" description='The "Trusted by the community" strip on the home page.' />
      <div className="max-w-3xl">
        <PartnerEditor partners={partners} />
      </div>
    </>
  );
}
