import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { DiscordIcon, InstagramIcon, TwitterIcon } from "@/components/brand/icons";
import { getSettings } from "@/lib/data/store";
import { CopyrightYear } from "./copyright-year";
import { site } from "@/lang/site";

const t = site.footer;

export async function SiteFooter() {
  const { discordUrl, footer, socials } = await getSettings();
  const { tagline } = footer;
  // An icon needs both the toggle and a real link
  const showDiscord = footer.showDiscord && !!discordUrl;
  const showTwitter = footer.showTwitter && !!socials.twitter;
  const showInstagram = footer.showInstagram && !!socials.instagram;

  return (
    <footer className="border-t border-white/[0.06] bg-[#111] py-14">
      <div className="container-page">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="shrink-0">
            <Link href="/" aria-label={site.nav.homeLabel} className="inline-block">
              <Wordmark className="text-[28px] [--logo-cut:#111]" />
            </Link>
            {tagline && (
              <p className="mt-3 max-w-[180px] text-sm leading-relaxed text-white/45">
                {tagline}
              </p>
            )}
            {(showDiscord || showTwitter || showInstagram) && (
              <div className="mt-5 flex gap-4 text-white/50">
                {showDiscord && (
                  <a href={discordUrl} target="_blank" rel="noreferrer" aria-label="Discord" className="transition hover:text-white">
                    <DiscordIcon className="size-5" />
                  </a>
                )}
                {showTwitter && (
                  <a href={socials.twitter} target="_blank" rel="noreferrer" aria-label="Twitter" className="transition hover:text-white">
                    <TwitterIcon className="size-5" />
                  </a>
                )}
                {showInstagram && (
                  <a href={socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="transition hover:text-white">
                    <InstagramIcon className="size-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Links grid */}
          <nav className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm" aria-label={t.label}>
            <Link href="/products" className="text-white/60 transition hover:text-white">{t.products}</Link>
            <Link href="/help#terms" className="text-white/60 transition hover:text-white">{t.terms}</Link>
            <Link href="/addons" className="text-white/60 transition hover:text-white">{t.addons}</Link>
            <Link href="/help#privacy" className="text-white/60 transition hover:text-white">{t.privacy}</Link>
            <Link href="/docs" className="text-white/60 transition hover:text-white">{t.docs}</Link>
            <Link href="/help" className="text-white/60 transition hover:text-white">{t.support}</Link>
            <Link href="/about" className="text-white/60 transition hover:text-white">{t.about}</Link>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-white/[0.06] pt-6 text-xs text-white/30 sm:flex-row">
          <span>© <CopyrightYear /> {t.copyright}</span>
          <span>{t.notAffiliated}</span>
        </div>
      </div>
    </footer>
  );
}
