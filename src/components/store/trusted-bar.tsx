import { getPartners } from "@/lib/data/store";

export async function TrustedBar() {
  const partners = await getPartners();
  if (partners.length === 0) return null;

  return (
    <div className="container-page">
      <div className="flex flex-col gap-6 rounded-2xl border border-white/[0.06] bg-[#1a1a1c] px-6 py-7 md:flex-row md:items-center">
        <div className="shrink-0">
          <p className="text-[15px] font-bold tracking-[0.12em]">TRUSTED BY THE COMMUNITY</p>
          <p className="text-sm text-white/70">Servers that run NOBODIES every day</p>
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
          {/* Duplicated list scrolls endlessly */}
          <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-10 hover:[animation-play-state:paused]">
            {[...partners, ...partners].map((p, i) => (
              <div key={`${p.id}-${i}`} className="flex items-center gap-3 opacity-80" aria-hidden={i >= partners.length}>
                {p.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- tiny logo, may be an animated GIF
                  <img src={p.logoUrl} alt="" className="size-8 rounded-md object-cover" loading="lazy" />
                ) : (
                  <span
                    className="grid size-8 place-items-center rounded-md text-sm font-black text-white"
                    style={{ background: p.color }}
                  >
                    {p.name[0]}
                  </span>
                )}
                <span>
                  <span className="block text-base font-bold text-white/80">{p.name}</span>
                  <span className="block text-[10px] font-semibold tracking-wide text-white/50">
                    {p.playersAvg} PLAYERS AVG
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
