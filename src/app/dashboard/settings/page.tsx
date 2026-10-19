import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DownloadIcon, KeyRoundIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireUser } from "@/lib/auth-guard";
import { discordLoginEnabled } from "@/lib/discord";
import { DiscordCard } from "@/components/panel/discord-card";
import { getOrdersWithItems } from "@/lib/data/account";
import { formatDate, formatPrice } from "@/lib/format";
import { PasswordForm, PreferencesForm, ProfileForm } from "@/components/panel/settings-forms";
import { Skeleton } from "@/components/ui/skeleton";
import { site } from "@/lang/site";

const t = site.settings;

export const metadata: Metadata = { title: site.meta.pages.settings };

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
          <Alert variant="info">
            <KeyRoundIcon />
            <AlertDescription>{t.noPassword}</AlertDescription>
          </Alert>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-[1fr_170px]">
        <section className={card}>
          <h2 className="text-xs font-bold tracking-[0.18em] text-white/60">{t.transactions}</h2>
          {orders.length === 0 ? (
            <p className="mt-6 text-sm text-white/50">{t.noTransactions}</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-y border-white/5 text-[10px] font-bold tracking-[0.14em] text-white/60">
                    <th className="py-3 pl-6">{t.columns.date}</th>
                    <th className="py-3">{t.columns.product}</th>
                    <th className="py-3">{t.columns.amount}</th>
                    <th className="py-3">{t.columns.status}</th>
                    <th className="py-3 text-center">{t.columns.invoice}</th>
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
                        <span className="rounded-sm bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success uppercase">● {t.orderStatuses[o.status]}</span>
                      </td>
                      <td className="py-5 text-center">
                        <a href={`/api/invoice/${o.id}`} aria-label={t.downloadInvoice} className="inline-flex text-brand-soft hover:text-white">
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
          <p className="font-bold">{t.customInvoice}</p>
          <p className="mt-2 text-xs text-white/60">{t.customInvoiceText}</p>
          <Link
            href="/help"
            className="mt-5 block rounded-sm bg-brand px-3 py-2 text-center text-sm font-bold text-white transition hover:bg-brand/85"
          >
            {t.requestInvoice}
          </Link>
        </section>
      </div>

      <section className={card}>
        <PreferencesForm marketingEmails={user.marketingEmails} />
      </section>
    </div>
  );
}
