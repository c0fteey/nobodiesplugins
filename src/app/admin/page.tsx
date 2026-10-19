import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenIcon, EuroIcon, InboxIcon, PackageIcon, ReceiptIcon, UsersIcon } from "lucide-react";
import { getAdminStats, getRecentOrders } from "@/lib/data/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { AdminCard, AdminHeader, td, th } from "@/components/admin/ui";
import { admin } from "@/lang/admin";

const t = admin.overview;

export const metadata: Metadata = { title: admin.meta.overview };

export default async function AdminOverview() {
  const [stats, orders] = await Promise.all([getAdminStats(), getRecentOrders(8)]);

  const tiles = [
    { label: t.tiles.revenue, value: formatPrice(stats.revenueCents), icon: EuroIcon, href: "/admin/orders" },
    { label: t.tiles.orders, value: stats.orders, icon: ReceiptIcon, href: "/admin/orders" },
    { label: t.tiles.users, value: stats.users, icon: UsersIcon, href: "/admin/users" },
    { label: t.tiles.products, value: stats.products, icon: PackageIcon, href: "/admin/products" },
    { label: t.tiles.messages, value: stats.openMessages, icon: InboxIcon, href: "/admin/messages" },
  ];

  return (
    <>
      <AdminHeader title={t.title} description={t.description} action={{ href: "/admin/products/new", label: t.newProduct }} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {tiles.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#171717] p-6 transition hover:border-brand/50">
            <Icon className="absolute -right-3 -bottom-4 size-24 text-white/[0.04] transition group-hover:text-brand/10" />
            <p className="text-[11px] font-bold tracking-[0.14em] text-white/60">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <AdminCard>
          <div className="flex items-center justify-between p-6">
            <h3 className="text-lg font-bold">{t.recentOrders}</h3>
            <Link href="/admin/orders" className="text-sm text-brand-soft hover:underline">{admin.common.viewAll}</Link>
          </div>
          {orders.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-white/50">{t.noOrders}</p>
          ) : (
            <table className="w-full">
              <thead className="border-y border-white/5">
                <tr><th className={th}>{admin.common.columns.date}</th><th className={th}>{admin.common.columns.customer}</th><th className={th}>{admin.common.columns.items}</th><th className={th}>{admin.common.columns.total}</th></tr>
              </thead>
              <tbody>
                {orders.map(({ order, email, items }) => (
                  <tr key={order.id} className="border-b border-white/5 last:border-0">
                    <td className={td}>{formatDate(order.createdAt)}</td>
                    <td className={td}>{email}</td>
                    <td className={`${td} text-white/70`}>{items.join(", ")}</td>
                    <td className={`${td} font-semibold`}>{formatPrice(order.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminCard>

        <AdminCard className="p-6">
          <h3 className="text-lg font-bold">{t.quickActions}</h3>
          <div className="mt-4 grid gap-2">
            {[
              { href: "/admin/products/new", label: t.actions.addProduct, icon: PackageIcon },
              { href: "/admin/docs/new", label: t.actions.writeDoc, icon: BookOpenIcon },
              { href: "/admin/settings", label: t.actions.editBanner, icon: InboxIcon },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-md bg-[#1e1e1e] px-4 py-3 text-sm font-semibold transition hover:bg-brand/20">
                <Icon className="size-4 text-brand-soft" /> {label}
              </Link>
            ))}
          </div>
        </AdminCard>
      </div>
    </>
  );
}
