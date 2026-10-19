import type { Metadata } from "next";
import { getUsers } from "@/lib/data/admin";
import { requireAdmin } from "@/lib/auth-guard";
import { formatDate, formatPrice } from "@/lib/format";
import { AdminCard, AdminHeader, td, th } from "@/components/admin/ui";
import { RoleSelect } from "@/components/admin/row-actions";

export const metadata: Metadata = { title: "Users · Admin" };

export default async function AdminUsersPage() {
  const [users, me] = await Promise.all([getUsers(), requireAdmin()]);

  return (
    <>
      <AdminHeader title="Users" description="Promote trusted people to admin. Role changes apply on their next request." />
      <AdminCard className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-white/5">
            <tr>
              <th className={th}>USER</th><th className={th}>JOINED</th><th className={th}>ORDERS</th>
              <th className={th}>SPENT</th><th className={th}>ROLE</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0">
                <td className={td}>
                  <span className="block font-semibold">{u.name ?? "—"}</span>
                  <span className="text-xs text-white/50">{u.email}</span>
                  {u.discordUsername && <span className="block text-xs text-[#8b95ff]">Discord: {u.discordUsername}</span>}
                </td>
                <td className={`${td} text-white/70`}>{formatDate(u.createdAt)}</td>
                <td className={td}>{u.orders ?? 0}</td>
                <td className={td}>{formatPrice(Number(u.spent ?? 0))}</td>
                <td className={td}>
                  <RoleSelect userId={u.id} role={u.role} disabled={u.id === me.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminCard>
    </>
  );
}
