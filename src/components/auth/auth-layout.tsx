import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { googleEnabled } from "@/auth";
import { discordLoginEnabled } from "@/lib/discord";
import { site } from "@/lang/site";
import { DiscordButton } from "./discord-button";
import { GoogleButton } from "./google-button";

const t = site.auth;

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  side: { title: string; text: string; cta: string; href: string };
  /** Prefix for the provider buttons' accessible names, e.g. "Şununla giriş yap:" -> "... Discord" */
  oauthLabel: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, side, oauthLabel, children }: AuthLayoutProps) {
  // Same layout on login and register: Discord and Google side by side, whichever are configured
  const providers = [discordLoginEnabled, googleEnabled].filter(Boolean).length;

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,40%)]">
      <div className="relative flex flex-col overflow-hidden">
        {/* Soft brand glow behind the form */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(91_43_255/0.22),transparent)]"
        />

        <header className="relative flex h-20 items-center px-5 sm:px-10">
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
          >
            <ArrowLeftIcon className="size-4" /> {t.store}
          </Link>
        </header>

        <main className="relative flex flex-1 items-center justify-center px-5 py-10">
          <div className="w-full max-w-[400px]">
            <div className="text-center">
              <LogoMark className="text-[40px] [--logo-cut:#141414]" />
              <h1 className="mt-6 text-[28px] leading-tight font-bold tracking-tight">{title}</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60">{subtitle}</p>
            </div>

            {providers > 0 && (
              <>
                <div className={providers > 1 ? "mt-8 grid grid-cols-2 gap-3" : "mt-8"}>
                  {discordLoginEnabled && <DiscordButton label={`${oauthLabel} Discord`} />}
                  {googleEnabled && <GoogleButton label={`${oauthLabel} Google`} />}
                </div>
                <div className="my-7 flex items-center gap-4 text-xs text-white/40">
                  <span className="h-px flex-1 bg-white/10" /> {t.orEmail} <span className="h-px flex-1 bg-white/10" />
                </div>
              </>
            )}

            <div className={providers ? undefined : "mt-8"}>{children}</div>
          </div>
        </main>

        <footer className="relative flex items-center justify-center gap-5 px-5 pb-6 text-xs text-white/35">
          <span>{t.rights}</span>
          <Link href="/help" className="transition hover:text-white/70">{t.help}</Link>
          <Link href="/help#terms" className="transition hover:text-white/70">{t.terms}</Link>
        </footer>
      </div>

      <aside className="relative hidden overflow-hidden lg:block">
        <Image src="/images/auth-bg.jpg" alt="" fill priority sizes="40vw" className="object-cover" />
        {/* Tint the art into the brand purple like the reference */}
        <div className="absolute inset-0 bg-[#5b3bff] mix-blend-color" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#6d4bff]/40 via-[#5b2bff]/30 to-[#3b1fb0]/80" />
        <div className="absolute inset-x-0 bottom-[14%] px-12 text-center">
          <h2 className="text-3xl font-bold">{side.title}</h2>
          <p className="mx-auto mt-4 max-w-sm text-lg leading-snug text-white/90">{side.text}</p>
          <Link
            href={side.href}
            className="mt-8 inline-flex h-12 items-center rounded-full bg-white px-10 text-base font-semibold text-brand transition hover:bg-white/90"
          >
            {side.cta}
          </Link>
        </div>
      </aside>
    </div>
  );
}
