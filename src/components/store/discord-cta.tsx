import { DiscordIcon } from "@/components/brand/icons";
import { getSettings } from "@/lib/data/store";
import { site } from "@/lang/site";

export async function DiscordCta() {
  const { discordUrl } = await getSettings();

  return (
    <section className="container-page py-20">
      <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(110deg,#4a22e8,#5b2bff_55%,#6d3cff)] px-8 py-16 sm:px-14">
        <div aria-hidden className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(115deg,transparent_0_60px,rgba(255,255,255,.08)_60px_62px)]" />
        {/* voxel decoration */}
        <div aria-hidden className="absolute -right-6 -bottom-10 hidden gap-3 sm:flex">
          {["#f472b6", "#a78bfa", "#fde047"].map((c, i) => (
            <span
              key={c}
              className="block size-28 rounded-md shadow-[inset_-10px_-10px_0_rgba(0,0,0,.25),inset_10px_10px_0_rgba(255,255,255,.25)]"
              style={{ background: c, transform: `rotate(${-8 + i * 9}deg) translateY(${i * -18}px)` }}
            />
          ))}
        </div>
        <h2 className="relative max-w-md text-3xl leading-tight font-bold sm:text-4xl">
          {site.discordCta.title}
        </h2>
        <a
          href={discordUrl}
          target="_blank"
          rel="noreferrer"
          className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-10 font-semibold text-brand transition hover:bg-white/90"
        >
          <DiscordIcon className="size-5" /> {site.common.joinDiscord}
        </a>
      </div>
    </section>
  );
}
