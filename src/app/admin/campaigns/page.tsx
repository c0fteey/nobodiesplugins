import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { getAllCampaigns, getAllProducts } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { AdminCard, AdminHeader, StatusPill, td, th } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Campaigns · Admin" };

export default async function AdminCampaignsPage() {
  const [campaigns, products] = await Promise.all([getAllCampaigns(), getAllProducts()]);
  const name = new Map(products.map((p) => [p.id, p.name]));

  return (
    <>
      <AdminHeader
        title="Campaigns"
        description='"Buy X, get Y free". The free product is delivered automatically with the order, and the offer card with a countdown shows on X.'
        action={{ href: "/admin/campaigns/new", label: "New campaign" }}
      />
      <AdminCard className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-white/5">
            <tr>
              <th className={th}>CAMPAIGN</th>
              <th className={th}>BUY → GET FREE</th>
              <th className={th}>RUNS</th>
              <th className={th}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className={td}>
                  <Link href={`/admin/campaigns/${c.id}`} className="font-semibold hover:text-brand-soft">{c.name}</Link>
                  <span className="block text-xs text-white/50">{c.label} · {c.headline}</span>
                </td>
                <td className={td}>
                  <span className="inline-flex items-center gap-2">
                    {name.get(c.triggerProductId)} <ArrowRightIcon className="size-3.5 text-success" />
                    <span className="text-success">{name.get(c.rewardProductId)}</span>
                  </span>
                </td>
                <td className={`${td} text-xs text-white/60`}>
                  {c.startsAt ? formatDate(c.startsAt) : "Now"} → {c.endsAt ? formatDate(c.endsAt) : "No end"}
                </td>
                <td className={td}><StatusPill on={c.active} onLabel="Active" offLabel="Off" /></td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr><td className={`${td} text-white/50`} colSpan={4}>No campaigns yet.</td></tr>
            )}
          </tbody>
        </table>
      </AdminCard>
    </>
  );
}
