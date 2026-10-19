"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Campaign, Product } from "@/db/schema";
import { useNow } from "@/hooks/use-now";
import { formatPrice } from "@/lib/format";
import { useCart } from "../cart-provider";
import { site } from "@/lang/site";

const t = site.product.offer;

function isLive(c: Campaign, now: number) {
  const start = c.startsAt ? new Date(c.startsAt).getTime() : -Infinity;
  const end = c.endsAt ? new Date(c.endsAt).getTime() : Infinity;
  return c.active && start <= now && now < end;
}

/** "Buy X, get Y free" cards with a live countdown, for the product being viewed. */
export function OfferCards({ product }: { product: Product }) {
  const { campaigns, catalog } = useCart();
  const now = useNow();
  if (now === null) return null;

  const offers = campaigns
    .filter((c) => c.triggerProductId === product.id && isLive(c, now))
    .map((c) => ({ campaign: c, reward: catalog.find((p) => p.id === c.rewardProductId) }))
    .filter((o): o is { campaign: Campaign; reward: Product } => !!o.reward);

  return (
    <AnimatePresence>
      {offers.map(({ campaign, reward }) => (
        <motion.div
          key={campaign.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex flex-col gap-5 rounded-2xl border border-success/40 bg-[linear-gradient(100deg,#2b1d3d_0%,#1d2530_55%,#13301f_100%)] p-6 sm:flex-row sm:items-center"
        >
          <div className="flex-1">
            <span className="inline-block rounded-full bg-success px-3 py-0.5 text-xs font-extrabold tracking-wide text-[#062b14] uppercase">
              {campaign.label}
            </span>
            <p className="mt-3 text-xl leading-snug font-bold">{campaign.headline}</p>
            <p className="mt-1 text-sm text-white/70">
              {campaign.text ||
                t.defaultText(formatPrice(reward.priceCents), product.name)}
            </p>
          </div>
          {campaign.endsAt && <Countdown to={new Date(campaign.endsAt).getTime()} now={now} />}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

function Countdown({ to, now }: { to: number; now: number }) {
  const left = Math.max(0, to - now);
  const parts = [
    { value: Math.floor(left / 86_400_000), unit: t.units.d },
    { value: Math.floor(left / 3_600_000) % 24, unit: t.units.h },
    { value: Math.floor(left / 60_000) % 60, unit: t.units.m },
    { value: Math.floor(left / 1000) % 60, unit: t.units.s },
  ];

  return (
    <div className="shrink-0 text-center">
      <p className="mb-2 text-xs font-bold tracking-[0.12em] text-white/60">{t.endsIn}</p>
      <div className="flex gap-2">
        {parts.map((p) => (
          <div key={p.unit} className="w-14 rounded-lg bg-black/40 py-2">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={p.value}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                className="block text-2xl font-extrabold tabular-nums"
              >
                {String(p.value).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
            <span className="text-[11px] font-bold text-brand-soft">{p.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
