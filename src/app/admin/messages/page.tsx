import type { Metadata } from "next";
import { getMessages } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { AdminHeader } from "@/components/admin/ui";
import { HandledButton } from "@/components/admin/row-actions";
import { cn } from "@/lib/utils";
import { admin } from "@/lang/admin";

const t = admin.messages;

export const metadata: Metadata = { title: admin.meta.messages + admin.meta.suffix };

export default async function AdminMessagesPage() {
  const messages = await getMessages();

  return (
    <>
      <AdminHeader title={t.title} description={t.description} />
      <div className="max-w-4xl space-y-3">
        {messages.length === 0 && <p className="text-sm text-white/50">{t.empty}</p>}
        {messages.map((m) => (
          <article key={m.id} className={cn("rounded-xl border border-white/10 bg-[#171717] p-5", m.handled && "opacity-60")}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-brand/20 px-2 py-0.5 text-xs font-semibold text-brand-soft">{t.subjects[m.subject] ?? m.subject}</span>
              <span className="font-semibold">{m.name || admin.common.anonymous}</span>
              <a href={`mailto:${m.email}`} className="text-sm text-white/60 hover:text-white">{m.email}</a>
              <span className="ml-auto text-xs text-white/40">{formatDate(m.createdAt)}</span>
              <HandledButton id={m.id} handled={m.handled} />
            </div>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-white/80">{m.message}</p>
          </article>
        ))}
      </div>
    </>
  );
}
