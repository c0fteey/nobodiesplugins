import type { Metadata } from "next";
import Link from "next/link";
import { getCoupons } from "@/lib/data/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { AdminCard, AdminHeader, StatusPill, td, th } from "@/components/admin/ui";
import { admin } from "@/lang/admin";

const t = admin.coupons;
const c$ = admin.common;

export const metadata: Metadata = { title: admin.meta.coupons + admin.meta.suffix };

export default async function AdminCouponsPage() {
  const rows = await getCoupons();

  return (
    <>
      <AdminHeader
        title={t.title}
        description={t.description}
        action={{ href: "/admin/coupons/new", label: t.newCoupon }}
      />
      <AdminCard className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-white/5">
            <tr>
              <th className={th}>{t.columns.code}</th>
              <th className={th}>{t.columns.discount}</th>
              <th className={th}>{t.columns.for}</th>
              <th className={th}>{t.columns.uses}</th>
              <th className={th}>{t.columns.valid}</th>
              <th className={th}>{t.columns.status}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ coupon: c, ownerEmail, expired }) => {
              return (
                <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className={td}>
                    <Link href={`/admin/coupons/${c.id}`} className="font-mono font-bold hover:text-brand-soft">{c.code}</Link>
                    <span className="block text-xs text-white/50">{c.description}</span>
                  </td>
                  <td className={`${td} font-semibold`}>{c.type === "percent" ? `%${c.amount}` : formatPrice(c.amount)}</td>
                  <td className={`${td} text-white/70`}>
                    {ownerEmail ? (
                      <span className="rounded bg-brand/15 px-1.5 py-0.5 text-xs text-brand-soft">👤 {ownerEmail}</span>
                    ) : c.creatorName ? (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-300">★ {c.creatorName}</span>
                    ) : (
                      c$.everyone
                    )}
                    {c.productIds.length > 0 && <span className="block text-xs text-white/40">{t.productsOnly(c.productIds.length)}</span>}
                  </td>
                  <td className={td}>
                    {c.usesCount}
                    {c.maxUses != null && <span className="text-white/40"> / {c.maxUses}</span>}
                  </td>
                  <td className={`${td} text-xs text-white/60`}>
                    {c.startsAt ? formatDate(c.startsAt) : c$.now} → {c.expiresAt ? formatDate(c.expiresAt) : c$.noEnd}
                  </td>
                  <td className={td}>
                    <StatusPill on={c.active && !expired} onLabel={c$.active} offLabel={expired ? c$.expired : c$.off} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td className={`${td} text-white/50`} colSpan={6}>{t.empty}</td></tr>
            )}
          </tbody>
        </table>
      </AdminCard>
    </>
  );
}
