import type { Metadata } from "next";
import { Suspense } from "react";
import { ActivityIcon, KeyRoundIcon, ServerIcon, ShieldIcon } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { countConnected, getLicenses } from "@/lib/data/account";
import { timeAgo } from "@/lib/format";
import { LicenseTable } from "@/components/panel/license-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { site } from "@/lang/site";

const t = site.licenses;

export const metadata: Metadata = { title: site.meta.pages.licenses };

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
  const revoked = rows.length - active.length;
  const checks = rows.reduce((sum, r) => sum + r.license.activations, 0);
  const connected = countConnected(rows);
  // Real activity only: licenses a plugin has verified, most recent first
  const recent = rows
    .filter((r) => r.license.lastSeenAt)
    .sort((a, b) => b.license.lastSeenAt!.getTime() - a.license.lastSeenAt!.getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={ShieldIcon} label={t.totalActive} value={active.length} note={revoked ? t.revokedCount(revoked) : undefined} />
        <StatCard icon={ActivityIcon} label={t.totalChecks} value={checks} note={t.checksHint} />
        <StatCard icon={ServerIcon} label={t.connected} value={connected} note={connected ? t.online(connected) : t.noneOnline} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border border-white/10 bg-[#171717] p-8">
          <h2 className="text-xl font-bold">{t.managed}</h2>
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
        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-[#171717] p-8">
            <h2 className="text-xl font-bold">{t.recent}</h2>
            {recent.length === 0 ? (
              <p className="mt-6 text-sm text-white/45">{t.recentEmpty}</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {recent.map((r) => (
                  <li key={r.license.id} className="flex items-start gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5">
                    <ServerIcon className="mt-0.5 size-4 shrink-0 text-brand-soft" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{r.productName}</span>
                      <span className="block truncate text-xs text-white/50">
                        {[r.license.lastServer, t.lastSeen(timeAgo(r.license.lastSeenAt!))].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <Alert variant="info">
            <KeyRoundIcon />
            <AlertTitle>{t.howToTitle}</AlertTitle>
            <AlertDescription>{t.howToText}</AlertDescription>
          </Alert>
        </div>
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
  note?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#171717] p-8">
      <Icon className="absolute -right-4 -bottom-6 size-36 text-white/[0.03]" />
      <p className="text-[11px] font-bold tracking-[0.16em] text-white/60">{label}</p>
      <p className="mt-3 text-4xl font-bold">{value}</p>
      {note && <p className="mt-2 text-xs font-semibold text-brand-soft">{note}</p>}
    </div>
  );
}
