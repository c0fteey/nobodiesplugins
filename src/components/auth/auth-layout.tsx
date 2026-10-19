import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { googleEnabled } from "@/auth";
import { discordLoginEnabled } from "@/lib/discord";
import { DiscordButton } from "./discord-button";
import { GoogleButton } from "./google-button";

type AuthLayoutProps = {
  heading: React.ReactNode;
  side: { title: string; text: string; cta: string; href: string };
  /** Prefix for the provider buttons, e.g. "Login with" -> "Login with Discord" */
  oauthLabel: string;
  children: React.ReactNode;
};

export function AuthLayout({ heading, side, oauthLabel, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col">
        <div className="flex h-[100px] items-center border-b border-white/10 px-8">
          <Link href="/" aria-label="Back to store" className="text-white/80 transition hover:text-white">
            <ChevronLeftIcon className="size-6" />
          </Link>
        </div>
        <div className="flex flex-1 items-start justify-center px-4 py-6">
          <div className="w-full max-w-[452px] rounded-2xl border border-white/10 bg-[#1e1e1e] px-8 pt-12 pb-8 shadow-2xl shadow-black/50">
            <div className="flex justify-center">
              <LogoMark className="text-5xl [--logo-cut:#1e1e1e]" />
            </div>
            <h1 className="mt-5 text-center text-2xl leading-snug font-bold">{heading}</h1>
            <div className="mt-10">{children}</div>
            {(googleEnabled || discordLoginEnabled) && (
              <>
                <div className="my-6 flex items-center gap-4 text-sm text-white/60">
                  <span className="h-px flex-1 bg-white/15" /> or <span className="h-px flex-1 bg-white/15" />
                </div>
                <div className="space-y-3">
                  {discordLoginEnabled && <DiscordButton label={`${oauthLabel} Discord`} />}
                  {googleEnabled && <GoogleButton label={`${oauthLabel} Google`} />}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden lg:block">
        <Image src="/images/auth-bg.jpg" alt="" fill priority sizes="34vw" className="object-cover" />
        {/* Tint the art into the brand purple like the reference */}
        <div className="absolute inset-0 bg-[#5b3bff] mix-blend-color" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#6d4bff]/40 via-[#5b2bff]/30 to-[#3b1fb0]/70" />
        <div className="absolute inset-x-0 bottom-[16%] px-10 text-center">
          <h2 className="text-3xl font-bold">{side.title}</h2>
          <p className="mx-auto mt-4 max-w-sm text-lg leading-snug text-white/90">{side.text}</p>
          <Link
            href={side.href}
            className="mt-8 inline-flex h-12 items-center rounded-md bg-white px-10 text-lg font-semibold text-brand transition hover:bg-white/90"
          >
            {side.cta}
          </Link>
        </div>
      </aside>
    </div>
  );
}
