import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DownloadIcon } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { discordLoginEnabled } from "@/lib/discord";
import { DiscordCard } from "@/components/panel/discord-card";
import { getOrdersWithItems } from "@/lib/data/account";
import { formatDate, formatPrice } from "@/lib/format";
import { PasswordForm, PreferencesForm, ProfileForm } from "@/components/panel/settings-forms";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[900px] rounded-xl" />}>
      <Settings />
    </Suspense>
  );
}

const card = "rounded-xl border border-white/10 bg-[#171717] p-8";

async function Settings() {
  const user = await requireUser();
  const orders = await getOrdersWithItems(user.id);

  return (
    <div className="max-w-[830px] space-y-4">
      <section className={card}>
        <ProfileForm name={user.name ?? ""} email={user.email} image={user.image} />
      </section>

      <section className={card}>
        <DiscordCard available={discordLoginEnabled} username={user.discordUsername} />
      </section>

      <section className={card}>
        {user.passwordHash ? (
          <PasswordForm />
        ) : (
          <p className="text-sm text-white/60">You signed in with Google or Discord, so there is no password to change.</p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-[1fr_170px]">
        <section className={card}>
          <h2 className="text-xs font-bold tracking-[0.18em] text-white/60">PAYMENT TRANSACTIONS</h2>
          {orders.length === 0 ? (
            <p className="mt-6 text-sm text-white/50">No transactions yet.</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-y border-white/5 text-[10px] font-bold tracking-[0.14em] text-white/60">
                    <th className="py-3 pl-6">DATE</th>
                    <th className="py-3">PRODUCT</th>
                    <th className="py-3">AMOUNT</th>
                    <th className="py-3">STATUS</th>
                    <th className="py-3 text-center">INVOICE</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-white/5">
                      <td className="py-5 pl-6 text-white/85">{formatDate(o.createdAt)}</td>
                      <td className="py-5 font-semibold">
                        {o.productNames[0]}
                        {o.productNames.length > 1 && <span className="text-white/50"> +{o.productNames.length - 1}</span>}
                      </td>
                      <td className="py-5">{formatPrice(o.totalCents)}</td>
                      <td className="py-5">
                        <span className="rounded-sm bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success uppercase">● {o.status}</span>
                      </td>
                      <td className="py-5 text-center">
                        <a href={`/api/invoice/${o.id}`} aria-label="Download invoice" className="inline-flex text-brand-soft hover:text-white">
                          <DownloadIcon className="size-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="rounded-xl border border-white/10 bg-[#13121c] p-6">
          <p className="font-bold">Need a Custom Invoice?</p>
          <p className="mt-2 text-xs text-white/60">Contact our team for VAT invoices or corporate purchase setups.</p>
          <Link
            href="/help"
            className="mt-5 block rounded-sm bg-brand px-3 py-2 text-center text-sm font-bold text-white transition hover:bg-brand/85"
          >
            Request Custom Invoice
          </Link>
        </section>
      </div>

      <section className={card}>
        <PreferencesForm marketingEmails={user.marketingEmails} />
      </section>
    </div>
  );
}
