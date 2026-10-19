import type { Metadata } from "next";
import { getRecentOrders } from "@/lib/data/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { AdminCard, AdminHeader, td, th } from "@/components/admin/ui";
import { admin } from "@/lang/admin";

const t = admin.orders;
const col = admin.common.columns;

export const metadata: Metadata = { title: admin.meta.orders + admin.meta.suffix };

export default async function AdminOrdersPage() {
  const orders = await getRecentOrders(200);

  return (
    <>
      <AdminHeader title={t.title} description={t.description} />
      <AdminCard className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-white/5">
            <tr>
              <th className={th}>{col.date}</th><th className={th}>{t.columns.order}</th><th className={th}>{col.customer}</th>
              <th className={th}>{col.items}</th><th className={th}>{t.columns.discount}</th><th className={th}>{col.total}</th><th className={th}>{col.status}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(({ order, email, items }) => (
              <tr key={order.id} className="border-b border-white/5 last:border-0">
                <td className={td}>{formatDate(order.createdAt)}</td>
                <td className={`${td} font-mono text-xs text-white/60`}>
                  #{order.id.slice(0, 8).toUpperCase()}
                  {order.couponCode === "ADMIN-GRANT" && (
                    <span className="mt-1 block w-fit rounded bg-brand/15 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-brand-soft">{t.grant}</span>
                  )}
                </td>
                <td className={td}>{email}</td>
                <td className={`${td} text-white/70`}>{items.join(", ")}</td>
                <td className={`${td} text-success`}>{order.discountCents ? `−${formatPrice(order.discountCents)}` : "—"}</td>
                <td className={`${td} font-semibold`}>{formatPrice(order.totalCents)}</td>
                <td className={td}>
                  <span className="rounded-sm bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success uppercase">{admin.orderStatuses[order.status]}</span>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td className={`${td} text-white/50`} colSpan={7}>{t.empty}</td></tr>
            )}
          </tbody>
        </table>
      </AdminCard>
    </>
  );
}
