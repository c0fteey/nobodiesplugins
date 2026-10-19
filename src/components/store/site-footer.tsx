import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { DiscordIcon, InstagramIcon, TwitterIcon } from "@/components/brand/icons";
import { getSettings } from "@/lib/data/store";
import { CopyrightYear } from "./copyright-year";

export async function SiteFooter() {
  const { discordUrl, footer } = await getSettings();
  const { tagline, showDiscord, showTwitter, showInstagram } = footer;

  return (
    <footer className="border-t border-white/[0.06] bg-[#111] py-14">
      <div className="container-page">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="shrink-0">
            <Link href="/" aria-label="NOBODIES home" className="inline-block">
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
                  <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="transition hover:text-white">
                    <TwitterIcon className="size-5" />
                  </a>
                )}
                {showInstagram && (
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="transition hover:text-white">
                    <InstagramIcon className="size-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Links grid */}
          <nav className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm" aria-label="Footer">
            <Link href="/products" className="text-white/60 transition hover:text-white">Products</Link>
            <Link href="/help#terms" className="text-white/60 transition hover:text-white">Terms</Link>
            <Link href="/addons" className="text-white/60 transition hover:text-white">Addons</Link>
            <Link href="/help#privacy" className="text-white/60 transition hover:text-white">Privacy</Link>
            <Link href="/docs" className="text-white/60 transition hover:text-white">Docs</Link>
            <Link href="/help" className="text-white/60 transition hover:text-white">Support</Link>
            <Link href="/about" className="text-white/60 transition hover:text-white">About</Link>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-white/[0.06] pt-6 text-xs text-white/30 sm:flex-row">
          <span>Copyright © <CopyrightYear /> NOBODIES — All rights reserved</span>
          <span>Not affiliated with Minecraft or Mojang AB</span>
        </div>
      </div>
    </footer>
  );
}
