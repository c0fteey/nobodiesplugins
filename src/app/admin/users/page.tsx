import type { Metadata } from "next";
import { getAllProducts, getOwnership, getUsers } from "@/lib/data/admin";
import { requireAdmin } from "@/lib/auth-guard";
import { formatDate, formatPrice } from "@/lib/format";
import { AdminCard, AdminHeader, td, th } from "@/components/admin/ui";
import { RoleSelect } from "@/components/admin/row-actions";
import { UserProducts } from "@/components/admin/user-products";
import { getRoles } from "@/lib/data/roles";
import { admin } from "@/lang/admin";

const t = admin.users;

export const metadata: Metadata = { title: admin.meta.users + admin.meta.suffix };

export default async function AdminUsersPage() {
  const [users, me, roles, products, ownership] = await Promise.all([
    getUsers(),
    requireAdmin(),
    getRoles(),
    getAllProducts(),
    getOwnership(),
  ]);
  const roleOptions = roles.map((r) => ({ key: r.key, name: r.name, color: r.color }));
  const productOptions = products.map((p) => ({ id: p.id, name: p.name, type: p.type }));

  return (
    <>
      <AdminHeader title={t.title} description={t.description} action={{ href: "/admin/roles", label: admin.roles.title }} />
      <AdminCard className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-white/5">
            <tr>
              <th className={th}>{t.columns.user}</th><th className={th}>{t.columns.joined}</th><th className={th}>{t.columns.orders}</th>
              <th className={th}>{t.columns.spent}</th><th className={th}>{t.columns.role}</th><th className={th} />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0">
                <td className={td}>
                  <span className="block font-semibold">{u.name ?? "—"}</span>
                  <span className="text-xs text-white/50">{u.email}</span>
                  {u.discordUsername && <span className="block text-xs text-[#8b95ff]">{t.discord(u.discordUsername)}</span>}
                </td>
                <td className={`${td} text-white/70`}>{formatDate(u.createdAt)}</td>
                <td className={td}>{u.orders ?? 0}</td>
                <td className={td}>{formatPrice(Number(u.spent ?? 0))}</td>
                <td className={td}>
                  <RoleSelect userId={u.id} role={u.role} roles={roleOptions} disabled={u.id === me.id} />
                </td>
                <td className={`${td} text-right`}>
                  <UserProducts userId={u.id} who={u.name || u.email} owned={ownership.get(u.id) ?? []} products={productOptions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminCard>
    </>
  );
}
