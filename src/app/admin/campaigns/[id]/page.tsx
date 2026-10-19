import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProducts, getCampaignById } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { CampaignForm } from "@/components/admin/campaign-form";

export const metadata: Metadata = { title: "Edit campaign · Admin" };

export default async function EditCampaignPage({ params }: PageProps<"/admin/campaigns/[id]">) {
  const { id } = await params;
  const isNew = id === "new";
  const [campaign, products] = await Promise.all([isNew ? null : getCampaignById(id), getAllProducts()]);
  if (!isNew && !campaign) notFound();

  return (
    <>
      <AdminHeader title={isNew ? "New campaign" : `Edit ${campaign!.name}`} />
      <CampaignForm
        campaign={campaign}
        products={products.map((p) => ({ id: p.id, name: p.name, priceCents: p.priceCents }))}
      />
    </>
  );
}
