import type { Metadata } from "next";
import { LockIcon, MailIcon, MessageCircleIcon, TrophyIcon } from "lucide-react";
import { DiscordIcon, InstagramIcon, YoutubeIcon } from "@/components/brand/icons";
import { getPartners, getProducts, getSettings } from "@/lib/data/store";
import { OutlineMark } from "@/components/store/outline-mark";

export const metadata: Metadata = { title: "About us" };

const FEATURES = [
  {
    icon: TrophyIcon,
    title: "Quality Products",
    text: "Experience top-quality with our Minecraft plugins, builds, and models, all rigorously tested to enhance gameplay and functionality without compromising performance.",
  },
  {
    icon: MessageCircleIcon,
    title: "Stellar support",
    text: "Our dedicated support team is always ready to help, whether you need assistance with plugin installation or server optimization, we're here to help every step of the way.",
  },
  {
    icon: LockIcon,
    title: "Exclusive Content",
    text: "Discover unique Minecraft content only available at NOBODIES, from epic builds to specialized plugins and amazing models that make your server stand out.",
  },
];

export default async function AboutPage() {
  const [settings, products, partners] = await Promise.all([getSettings(), getProducts(), getPartners()]);
  const players = partners.reduce((sum, p) => sum + p.playersAvg, 0);
  const stats = [
    { value: products.filter((p) => p.type === "plugin").length, label: "Plugins" },
    { value: products.filter((p) => p.type !== "plugin").length, label: "Add-ons, models & builds" },
    { value: partners.length, label: "Partner servers" },
    { value: players.toLocaleString("en-US"), label: "Players on partner servers" },
  ];

  return (
    <>
      <section className="container-page grid items-center gap-10 py-16 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold">About Us</p>
          <h1 className="mt-3 text-4xl leading-[1.05] font-bold tracking-[-0.03em] sm:text-5xl">
            At NOBODIES, Your
            <br /> Priorities are Ours
          </h1>
          <p className="mt-10 max-w-md text-lg leading-relaxed font-bold">
            At NOBODIES, we specialize in enhancing your Minecraft gameplay through an extensive selection of premium
            plugins, custom builds, and exclusive models. We are dedicated to offering the best Minecraft enhancements
            that help server owners and players create unforgettable gaming experiences.
          </p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/85">
            Our mission is to provide the Minecraft community with innovative and reliable products that transform your
            server. We offer a range of solutions from aesthetic modifications to functional plugins that ensure you can
            fully personalize and optimize your Minecraft server.
          </p>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <MailIcon className="size-4" /> For customer service
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
              <DiscordIcon className="size-5" /> Join Discord
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="text-brand-soft">
              <YoutubeIcon className="size-7" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="text-brand-soft">
              <InstagramIcon className="size-6" />
            </a>
          </div>
        </div>
        <OutlineMark />
      </section>

      <section className="container-page py-16">
        <h2 className="text-4xl font-bold tracking-tight">What makes us different</h2>
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
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Trusted by server owners</h2>
        <div className="container-page mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
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
          Meet the community
        </a>
      </section>
    </>
  );
}
