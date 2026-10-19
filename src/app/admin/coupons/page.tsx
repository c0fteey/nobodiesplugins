import type { Metadata } from "next";
import Link from "next/link";
import { getCoupons } from "@/lib/data/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { AdminCard, AdminHeader, StatusPill, td, th } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Coupons · Admin" };

export default async function AdminCouponsPage() {
  const rows = await getCoupons();

  return (
    <>
      <AdminHeader
        title="Coupons"
        description="Public codes, creator codes and coupons locked to a single account."
        action={{ href: "/admin/coupons/new", label: "New coupon" }}
      />
      <AdminCard className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-white/5">
            <tr>
              <th className={th}>CODE</th>
              <th className={th}>DISCOUNT</th>
              <th className={th}>FOR</th>
              <th className={th}>USES</th>
              <th className={th}>VALID</th>
              <th className={th}>STATUS</th>
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
                  <td className={`${td} font-semibold`}>{c.type === "percent" ? `${c.amount}%` : formatPrice(c.amount)}</td>
                  <td className={`${td} text-white/70`}>
                    {ownerEmail ? (
                      <span className="rounded bg-brand/15 px-1.5 py-0.5 text-xs text-brand-soft">👤 {ownerEmail}</span>
                    ) : c.creatorName ? (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-300">★ {c.creatorName}</span>
                    ) : (
                      "Everyone"
                    )}
                    {c.productIds.length > 0 && <span className="block text-xs text-white/40">{c.productIds.length} product(s) only</span>}
                  </td>
                  <td className={td}>
                    {c.usesCount}
                    {c.maxUses != null && <span className="text-white/40"> / {c.maxUses}</span>}
                  </td>
                  <td className={`${td} text-xs text-white/60`}>
                    {c.startsAt ? formatDate(c.startsAt) : "Now"} → {c.expiresAt ? formatDate(c.expiresAt) : "No end"}
                  </td>
                  <td className={td}>
                    <StatusPill on={c.active && !expired} onLabel="Active" offLabel={expired ? "Expired" : "Off"} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td className={`${td} text-white/50`} colSpan={6}>No coupons yet.</td></tr>
            )}
          </tbody>
        </table>
      </AdminCard>
    </>
  );
}
