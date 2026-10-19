import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { getAllCampaigns, getAllProducts } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { AdminCard, AdminHeader, StatusPill, td, th } from "@/components/admin/ui";
import { admin } from "@/lang/admin";

const t = admin.campaigns;
const c$ = admin.common;

export const metadata: Metadata = { title: admin.meta.campaigns + admin.meta.suffix };

export default async function AdminCampaignsPage() {
  const [campaigns, products] = await Promise.all([getAllCampaigns(), getAllProducts()]);
  const name = new Map(products.map((p) => [p.id, p.name]));

  return (
    <>
      <AdminHeader
        title={t.title}
        description={t.description}
        action={{ href: "/admin/campaigns/new", label: t.newCampaign }}
      />
      <AdminCard className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-white/5">
            <tr>
              <th className={th}>{t.columns.campaign}</th>
              <th className={th}>{t.columns.buyGet}</th>
              <th className={th}>{t.columns.runs}</th>
              <th className={th}>{t.columns.status}</th>
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
                  {c.startsAt ? formatDate(c.startsAt) : c$.now} → {c.endsAt ? formatDate(c.endsAt) : c$.noEnd}
                </td>
                <td className={td}><StatusPill on={c.active} onLabel={c$.active} offLabel={c$.off} /></td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr><td className={`${td} text-white/50`} colSpan={4}>{t.empty}</td></tr>
            )}
          </tbody>
        </table>
      </AdminCard>
    </>
  );
}
