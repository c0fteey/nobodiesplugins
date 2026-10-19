import type { Metadata } from "next";
import { Suspense } from "react";
import { LogInIcon, ServerIcon, ShieldIcon, ZapIcon } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { countConnected, getLicenses } from "@/lib/data/account";
import { LicenseTable } from "@/components/panel/license-table";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Licenses" };

export default function LicensesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-xl" />}>
      <Licenses />
    </Suspense>
  );
}

async function Licenses() {
  const user = await requireUser();
  const rows = await getLicenses(user.id);
  const active = rows.filter((r) => r.license.status === "active");
  const activations = rows.reduce((sum, r) => sum + r.license.activations, 0);
  const connected = countConnected(rows);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={ShieldIcon} label="TOTAL ACTIVE LICENSES" value={active.length} />
        <StatCard
          icon={ZapIcon}
          label="ACTIVE SESSIONS"
          value={0}
          note={<><ZapIcon className="size-3.5" /> {activations} activations all-time</>}
        />
        <StatCard
          icon={ServerIcon}
          label="CONNECTED SERVERS"
          value={connected}
          note={<><ServerIcon className="size-3.5" /> {connected ? `${connected} online` : "No servers online"}</>}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border border-white/10 bg-[#171717] p-8">
          <h2 className="text-xl font-bold">Managed Licenses</h2>
          <LicenseTable
            licenses={rows.map((r) => ({
              id: r.license.id,
              key: r.license.key,
              productId: r.license.productId,
              productName: r.productName,
              status: r.license.status,
              activations: r.license.activations,
            }))}
          />
        </section>
        <section className="flex flex-col rounded-xl border border-white/10 bg-[#171717] p-8">
          <h2 className="text-xl font-bold">Recent Activations</h2>
          <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
            <LogInIcon className="size-8 text-white/40" strokeWidth={1.4} />
            <p className="mt-4 text-sm font-bold text-white/70">No activations yet</p>
            <p className="mt-1 max-w-[240px] text-xs text-white/40">
              Server activations will appear here once your licences connect from a running server.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  note?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#171717] p-8">
      <Icon className="absolute -right-4 -bottom-6 size-36 text-white/[0.03]" />
      <p className="text-[11px] font-bold tracking-[0.16em] text-white/60">{label}</p>
      <p className="mt-3 text-4xl font-bold">{value}</p>
      {note && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-soft">{note}</p>}
    </div>
  );
}
