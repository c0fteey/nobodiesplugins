"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CloudDownloadIcon,
  DownloadIcon,
  GiftIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  ShoppingCartIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/db/schema";
import { claimFreeAction } from "@/actions/store";
import { useCart } from "@/components/store/cart-provider";
import { ProductArt } from "@/components/store/product-art";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice, formatPriceCompact } from "@/lib/format";
import { CreateLicenseButton } from "./create-license-button";
import { site } from "@/lang/site";

const t = site.dashboard;

const TONE = ["text-yellow-300", "text-brand-soft", "text-emerald-400", "text-sky-400"];

export function BundleCard({ plugin, items }: { plugin: Product; items: Product[] }) {
  const { add } = useCart();
  const total = items.reduce((s, p) => s + p.priceCents, 0);
  const was = items.reduce((s, p) => s + (p.compareAtCents ?? p.priceCents), 0);
  const savePct = was > total ? Math.round(((was - total) / was) * 100) : 0;
  const shortName = plugin.name.replace(/^NOBODIES\s+/i, "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-white/5 p-8 sm:p-10"
      style={{ background: `linear-gradient(120deg, #2a1d6e 0%, #1b1640 55%, #15131f 100%)` }}
    >
      <ProductArt
        product={plugin}
        size="lg"
        sizes="40vw"
        className="pointer-events-none absolute inset-y-0 right-0 w-3/5 opacity-25 [mask-image:linear-gradient(90deg,transparent,#000_70%)]"
      />
      <div className="relative">
        <div className="flex gap-2 text-xs font-semibold">
          <span className="rounded-sm border border-brand-soft/40 bg-brand/20 px-2 py-1 text-brand-soft">{t.bundle.bestValue}</span>
          {savePct > 0 && <span className="rounded-sm border border-success/40 bg-success/15 px-2 py-1 text-success">{t.bundle.save(savePct)}</span>}
        </div>
        <h2 className="mt-5 text-4xl leading-tight font-bold tracking-tight">
          {t.bundle.titleLine1}
          <br />
          <span className="text-brand-soft">{t.bundle.titleLine2(shortName)}</span>
        </h2>
        <p className="mt-5 max-w-md text-white/75">
          {t.bundle.text(plugin.name)}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              items.forEach((p, i) => add(p.id, { open: i === items.length - 1 }));
            }}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#8b6dff] px-5 font-semibold text-white transition hover:bg-[#8b6dff]/85"
          >
            <ShoppingCartIcon className="size-4" /> {t.bundle.get}
            {was > total && <s className="opacity-70">{formatPriceCompact(was)}</s>}
            {formatPriceCompact(total)}
          </button>
          <Link
            href={`/products/${plugin.slug}`}
            className="inline-flex h-11 items-center rounded-md border border-white/15 px-6 font-semibold transition hover:bg-white/5"
          >
            {t.bundle.details}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function PluginPanelCard({
  plugin,
  addons,
  ownedIds,
  seasonLabel,
  hasLicense,
}: {
  plugin: Product;
  addons: Product[];
  ownedIds: string[];
  seasonLabel: string;
  hasLicense: boolean;
}) {
  const { add } = useCart();
  const owned = new Set(ownedIds);
  const ownsPlugin = owned.has(plugin.id);
  // Owned but no key yet: the key comes first, then the download
  const needsKey = ownsPlugin && plugin.requiresLicense && !hasLicense;
  const tone = TONE[plugin.sortOrder % TONE.length];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col overflow-hidden rounded-xl border border-white/5 bg-[#171717]"
    >
      <div className="relative h-44">
        <ProductArt product={plugin} size="md" sizes="50vw" className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-transparent" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold">{plugin.name}</h3>
        <p className={`mt-1 text-xs font-bold tracking-[0.12em] uppercase ${tone}`}>
          {plugin.tagline ?? t.plugin.defaultTagline} v{plugin.version}
        </p>
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/75">{plugin.shortDescription}</p>

        <div className="mt-6 flex justify-between text-[11px] font-bold tracking-[0.12em] text-white/60">
          <span>{t.plugin.availableAddons}</span>
          <span className="font-medium tracking-normal">{t.plugin.addonsCount(addons.length)}</span>
        </div>
        <div className="mt-3 space-y-2">
          {addons.length === 0 ? (
            <p className="rounded-md bg-[#1e1e1e] py-3 text-center text-sm text-white/60">{t.plugin.noAddons}</p>
          ) : (
            addons.slice(0, 3).map((a) => <AddonRow key={a.id} addon={a} owned={owned.has(a.id)} />)
          )}
        </div>

        <div className="mt-auto pt-6">
          {!ownsPlugin && plugin.compareAtCents && (
            <p className="mb-3 text-center text-xs text-success">
              {t.plugin.save}<b>{formatPriceCompact(plugin.compareAtCents - plugin.priceCents)}</b>{t.plugin.seasonOffer(seasonLabel)}
            </p>
          )}
          <div className="flex gap-3">
            {needsKey ? (
              <CreateLicenseButton
                productId={plugin.id}
                className="h-11 flex-1 rounded-md bg-[#a68cff] text-[#120d2b] hover:bg-[#a68cff]/85"
              />
            ) : ownsPlugin ? (
              <a
                href={`/api/download/${plugin.id}`}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#a68cff] font-semibold text-[#120d2b] transition hover:bg-[#a68cff]/85"
              >
                <CloudDownloadIcon className="size-4" /> {t.plugin.download}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => add(plugin.id)}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#a68cff] font-semibold text-[#120d2b] transition hover:bg-[#a68cff]/85"
              >
                <ShoppingCartIcon className="size-4" /> {t.plugin.getFor(formatPrice(plugin.priceCents))}
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<button type="button" aria-label={t.plugin.moreActions} className="grid size-11 place-items-center rounded-md bg-[#232323] transition hover:bg-[#2c2c2c]" />}
              >
                <MoreHorizontalIcon className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem render={<Link href={`/products/${plugin.slug}`} />}>{t.plugin.viewProduct}</DropdownMenuItem>
                <DropdownMenuItem render={<Link href={`/addons?category=${plugin.slug}`} />}>{t.plugin.browseAddons}</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/docs" />}>{t.plugin.documentation}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {ownsPlugin && (
            <Link href="/help" className="mt-2 block text-center text-xs text-white/60 underline-offset-2 hover:underline">
              {t.plugin.cantDownload}
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function AddonRow({ addon, owned }: { addon: Product; owned: boolean }) {
  const { add } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const free = addon.priceCents === 0;

  const status = owned
    ? <span className="text-brand-soft">{free ? t.addon.claimed : t.addon.purchased}</span>
    : free
      ? <span className="text-brand-soft">{t.addon.notClaimedFree}</span>
      : <span className="text-brand-soft">{t.addon.notPurchased(formatPrice(addon.priceCents))}</span>;

  function act() {
    if (free) {
      startTransition(async () => {
        const result = await claimFreeAction(addon.id);
        if (!result.ok) return void toast.error(result.error);
        toast.success(t.addon.claimedToast(addon.name));
        router.refresh();
      });
    } else {
      add(addon.id);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-md bg-[#1e1e1e] px-4 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{addon.name}</p>
        <p className="text-[11px]">{status}</p>
      </div>
      {owned ? (
        <a href={`/api/download/${addon.id}`} aria-label={t.addon.download(addon.name)} className="grid size-8 place-items-center rounded-md bg-[#2a2a2a] text-white/80 hover:text-white">
          <DownloadIcon className="size-4" />
        </a>
      ) : (
        <button
          type="button"
          onClick={act}
          disabled={pending}
          aria-label={free ? t.addon.claim(addon.name) : t.addon.addToCart(addon.name)}
          className="grid size-8 place-items-center rounded-md bg-[#2a2a2a] text-white/80 transition hover:bg-brand hover:text-white"
        >
          {pending ? <Loader2Icon className="size-4 animate-spin" /> : free ? <GiftIcon className="size-4" /> : <ShoppingCartIcon className="size-4" />}
        </button>
      )}
    </div>
  );
}
