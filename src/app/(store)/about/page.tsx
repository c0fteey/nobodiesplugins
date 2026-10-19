import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LockIcon, MailIcon, MessageCircleIcon, TrophyIcon } from "lucide-react";
import { DiscordIcon, InstagramIcon, YoutubeIcon } from "@/components/brand/icons";
import { getPartners, getProducts, getSettings } from "@/lib/data/store";
import { OutlineMark } from "@/components/store/outline-mark";
import { site } from "@/lang/site";

const t = site.about;

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("about");
}

const FEATURES = [
  { icon: TrophyIcon, ...t.features.quality },
  { icon: MessageCircleIcon, ...t.features.support },
  { icon: LockIcon, ...t.features.exclusive },
];

export default async function AboutPage() {
  const [settings, products, partners] = await Promise.all([getSettings(), getProducts(), getPartners()]);
  const players = partners.reduce((sum, p) => sum + p.playersAvg, 0);
  // Only real numbers: partner stats disappear while there are no partners
  const stats = [
    { value: products.filter((p) => p.type === "plugin").length, label: t.stats.plugins },
    { value: products.filter((p) => p.type !== "plugin").length, label: t.stats.others },
    ...(partners.length ? [{ value: partners.length, label: t.stats.partners }] : []),
    ...(players ? [{ value: players.toLocaleString("tr-TR"), label: t.stats.players }] : []),
  ];

  return (
    <>
      <section className="container-page grid items-center gap-10 py-16 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold">{t.eyebrow}</p>
          <h1 className="mt-3 text-4xl leading-[1.05] font-bold tracking-[-0.03em] sm:text-5xl">
            {t.titleLine1}
            <br /> {t.titleLine2}
          </h1>
          <p className="mt-10 max-w-md text-lg leading-relaxed font-bold">{t.lead}</p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/85">{t.mission}</p>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <MailIcon className="size-4" /> {t.customerService}
            <a href={`mailto:${settings.supportEmail}`} className="text-white/70 hover:text-white">
              {settings.supportEmail}
            </a>
          </p>
          <div className="mt-8 flex items-center gap-6">
            <a
              href={settings.discordUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-12 font-semibold text-white transition hover:bg-brand/85"
            >
              <DiscordIcon className="size-5" /> {site.common.joinDiscord}
            </a>
            {settings.socials.youtube && (
              <a href={settings.socials.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="text-brand-soft">
                <YoutubeIcon className="size-7" />
              </a>
            )}
            {settings.socials.instagram && (
              <a href={settings.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-brand-soft">
                <InstagramIcon className="size-6" />
              </a>
            )}
          </div>
        </div>
        <OutlineMark />
      </section>

      <section className="container-page py-16">
        <h2 className="text-4xl font-bold tracking-tight">{t.differentTitle}</h2>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <span className="grid size-16 place-items-center rounded-full bg-[#1e1c33]">
                <Icon className="size-7 text-brand-soft" strokeWidth={1.6} />
              </span>
              <h3 className="mt-6 text-lg font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/85">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 bg-[#212b2a] py-24 text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.trustedTitle}</h2>
        <div className={`container-page mt-12 grid grid-cols-2 gap-8 ${stats.length > 2 ? "md:grid-cols-4" : "mx-auto max-w-xl"}`}>
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-success">{s.value}</p>
              <p className="mt-2 text-sm text-white/75">{s.label}</p>
            </div>
          ))}
        </div>
        <a
          href={settings.discordUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-12 inline-flex h-10 items-center rounded-full bg-[#14a06f] px-10 font-semibold text-white transition hover:bg-[#14a06f]/85"
        >
          {t.meetCommunity}
        </a>
      </section>
    </>
  );
}
