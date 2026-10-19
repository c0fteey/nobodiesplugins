import type { Metadata } from "next";
import { getRecentOrders } from "@/lib/data/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { AdminCard, AdminHeader, td, th } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Orders · Admin" };

export default async function AdminOrdersPage() {
  const orders = await getRecentOrders(200);

  return (
    <>
      <AdminHeader title="Orders" description="Latest 200 orders." />
      <AdminCard className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-white/5">
            <tr>
              <th className={th}>DATE</th><th className={th}>ORDER</th><th className={th}>CUSTOMER</th>
              <th className={th}>ITEMS</th><th className={th}>DISCOUNT</th><th className={th}>TOTAL</th><th className={th}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(({ order, email, items }) => (
              <tr key={order.id} className="border-b border-white/5 last:border-0">
                <td className={td}>{formatDate(order.createdAt)}</td>
                <td className={`${td} font-mono text-xs text-white/60`}>#{order.id.slice(0, 8).toUpperCase()}</td>
                <td className={td}>{email}</td>
                <td className={`${td} text-white/70`}>{items.join(", ")}</td>
                <td className={`${td} text-success`}>{order.discountCents ? `−${formatPrice(order.discountCents)}` : "—"}</td>
                <td className={`${td} font-semibold`}>{formatPrice(order.totalCents)}</td>
                <td className={td}>
                  <span className="rounded-sm bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success uppercase">{order.status}</span>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td className={`${td} text-white/50`} colSpan={7}>No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </AdminCard>
    </>
  );
}
