import type { Metadata } from "next";
import { DiscordIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from "@/components/brand/icons";
import { ContactForm } from "@/components/store/contact-form";
import { FaqList } from "@/components/store/faq-list";
import { getFaqs, getSettings } from "@/lib/data/store";
import { site } from "@/lang/site";

const t = site.help;

export const metadata: Metadata = { title: site.meta.pages.help };

export default async function HelpPage() {
  const [faqs, settings] = await Promise.all([getFaqs(), getSettings()]);

  const info = [
    { id: "company", ...t.blocks.company },
    { id: "refunds", ...t.blocks.refunds },
    { id: "bugs", ...t.blocks.bugs },
  ];

  return (
    <>
      <section className="container-page pt-14">
        <p className="text-sm font-bold">{t.eyebrow}</p>
        <h1 className="mt-2 text-5xl font-bold tracking-[-0.04em] sm:text-7xl">{t.title}</h1>
      </section>

      <section className="container-page grid gap-12 py-16 lg:grid-cols-2">
        <ContactForm />
        <div className="space-y-10">
          {info.map((block) => (
            <div key={block.id} id={block.id}>
              <h2 className="text-[15px] font-bold">{block.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/85">{block.text}</p>
            </div>
          ))}
          <div>
            <h2 className="text-[15px] font-bold">{t.directTitle}</h2>
            <p className="mt-3 text-sm text-white/85">
              {t.directBefore}
              <a href={`mailto:${settings.supportEmail}`} className="text-brand-soft hover:underline">
                {settings.supportEmail}
              </a>
              {t.directAfter}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a
              href={settings.discordUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-brand-soft/60 px-6 text-brand-soft transition hover:bg-brand/10"
            >
              <DiscordIcon className="size-5" /> {site.common.joinDiscord}
            </a>
            <YoutubeIcon className="size-7 text-brand-soft" />
            <TwitterIcon className="size-6 text-brand-soft" />
            <InstagramIcon className="size-6 text-brand-soft" />
          </div>
          <div id="terms" className="scroll-mt-8 rounded-lg bg-white/[0.03] p-5 text-xs leading-relaxed text-white/60">
            <p className="font-semibold text-white/80">{t.termsTitle}</p>
            {t.termsText}
            <span id="privacy" />
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="container-page pb-24">
          <h2 className="text-center text-4xl font-bold tracking-[-0.03em] sm:text-6xl">{t.faqTitle}</h2>
          <div className="mx-auto mt-14 max-w-2xl">
            <FaqList faqs={faqs} variant="large" defaultOpen={faqs[0]?.id} />
          </div>
        </section>
      )}
    </>
  );
}
