"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon, ChevronRightIcon, MenuIcon, ShoppingCartIcon, UserIcon, XIcon } from "lucide-react";
import type { NavItem, Product } from "@/db/schema";
import { Wordmark } from "@/components/brand/logo";
import { DiscordIcon } from "@/components/brand/icons";
import { DEFAULT_NAV_ITEMS } from "@/lib/site-defaults";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ProductArt } from "./product-art";
import { useCart } from "./cart-provider";
import { site } from "@/lang/site";

const t = site.nav;

export function HeaderNav({ plugins, discordUrl, navItems = DEFAULT_NAV_ITEMS }: { plugins: Product[]; discordUrl: string; navItems?: NavItem[] }) {
  const pathname = usePathname();
  const { items, open } = useCart();
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const visibleItems = navItems.filter((i) => i.visible);
  const productsItem = visibleItems.find((i) => i.href === "/products");
  const regularItems = visibleItems.filter((i) => i.href !== "/products");

  // Close menus on navigation (adjusting state during render, no effect needed)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMegaOpen(false);
    setMobileOpen(false);
  }

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setMegaOpen(false), 120);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl" onMouseLeave={scheduleClose}>
      <div className="container-page flex h-[68px] items-center gap-6">
        <Link href="/" aria-label={t.homeLabel} className="shrink-0">
          <Wordmark className="text-[26px]" />
        </Link>

        <nav className="mx-auto hidden items-center gap-8 lg:flex" aria-label={t.mainLabel}>
          {productsItem && (
            <button
              type="button"
              aria-expanded={megaOpen}
              onMouseEnter={openMega}
              onClick={() => setMegaOpen((v) => !v)}
              className="relative flex items-center gap-1.5 py-2 text-[17px] font-medium text-white/85 transition hover:text-white aria-expanded:text-white"
            >
              {productsItem.label}
              <ChevronDownIcon className={cn("size-4 transition-transform", megaOpen && "rotate-180")} />
              {megaOpen && (
                <motion.span layoutId="nav-underline" className="absolute -bottom-[30px] left-0 h-0.5 w-full bg-white" />
              )}
            </button>
          )}
          {regularItems.map((item, i) => (
            <Link
              key={`${item.href}-${i}`}
              href={item.href}
              onMouseEnter={scheduleClose}
              className={cn(
                "text-[17px] font-medium transition hover:text-white",
                pathname.startsWith(item.href) ? "text-white" : "text-white/85",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-5 lg:ml-0">
          <a
            href={discordUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Discord"
            className="flex items-center gap-2 text-[17px] font-medium text-white/85 transition hover:text-white"
          >
            <DiscordIcon className="size-6" /> <span className="hidden md:inline">Discord</span>
          </a>
          <Link href="/dashboard" aria-label={t.myAccount} className="text-white/85 transition hover:text-white">
            <UserIcon className="size-6" strokeWidth={1.6} />
          </Link>
          <button type="button" onClick={open} aria-label={t.openCart} className="relative text-white/85 transition hover:text-white">
            <ShoppingCartIcon className="size-6" strokeWidth={1.6} />
            <AnimatePresence>
              {items.length > 0 && (
                <motion.span
                  key={items.length}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white"
                >
                  {items.length}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            type="button"
            className="text-white/85 lg:hidden"
            aria-label={t.openMenu}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon className="size-7" />
          </button>
        </div>
      </div>

      {/* Products mega menu */}
      <AnimatePresence>
        {megaOpen && (
          <motion.div
            onMouseEnter={openMega}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-full hidden border-t border-white/5 bg-background pb-8 shadow-2xl shadow-black/60 lg:block"
          >
            <div className="container-page flex gap-14 pt-8">
              <div className="flex w-40 shrink-0 flex-col gap-5">
                <Link href="/products" className="text-2xl font-medium transition hover:text-brand-soft">
                  {t.allProducts}
                </Link>
                <Link href="/addons" className="text-2xl font-medium transition hover:text-brand-soft">
                  {t.addons}
                </Link>
              </div>
              <PluginCarousel plugins={plugins} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu: a Sheet renders in a portal, so the header's backdrop-blur
          (which traps position:fixed children) can't clip or see-through it */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" showCloseButton={false} className="w-full gap-0 border-white/10 bg-[#141414] p-0 sm:max-w-sm">
          <SheetTitle className="sr-only">{t.mainLabel}</SheetTitle>
          <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
            <Wordmark className="text-2xl [--logo-cut:#141414]" />
            <SheetClose aria-label={t.closeMenu} className="grid size-10 place-items-center rounded-md text-white/80 hover:bg-white/5 hover:text-white">
              <XIcon className="size-6" />
            </SheetClose>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 pt-2 pb-8" aria-label={t.mainLabel}>
            {visibleItems.map((item, i) => (
              <Link
                key={`${item.href}-${i}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between border-b border-white/5 py-4 text-lg font-semibold",
                  pathname.startsWith(item.href) && item.href !== "/" ? "text-brand-soft" : "text-white",
                )}
              >
                {item.label}
                <ChevronRightIcon className="size-4 text-white/30" />
              </Link>
            ))}
            {plugins.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-[11px] font-bold tracking-[0.14em] text-white/45 uppercase">{t.allProducts}</p>
                <div className="grid grid-cols-2 gap-3">
                  {plugins.slice(0, 4).map((p) => (
                    <Link key={p.id} href={`/products/${p.slug}`} onClick={() => setMobileOpen(false)} className="overflow-hidden rounded-lg ring-1 ring-white/10">
                      <ProductArt product={p} size="sm" sizes="45vw" className="aspect-[4/3] w-full" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex h-12 items-center justify-center gap-2 rounded-lg border border-white/10 text-sm font-semibold"
              >
                <UserIcon className="size-4" /> {t.myAccount}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  open();
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white"
              >
                <ShoppingCartIcon className="size-4" /> {t.openCart}
                {items.length > 0 && <span className="rounded-full bg-white/20 px-1.5 text-xs">{items.length}</span>}
              </button>
            </div>
            <a href={discordUrl} target="_blank" rel="noreferrer" className="mt-4 flex h-12 items-center justify-center gap-2 rounded-lg bg-[#5865f2] text-sm font-semibold text-white">
              <DiscordIcon className="size-5" /> {t.joinOurDiscord}
            </a>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}

export function PluginCarousel({ plugins, className }: { plugins: Product[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = () => ref.current?.scrollBy({ left: ref.current.clientWidth * 0.6, behavior: "smooth" });

  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <div ref={ref} className="scrollbar-none flex gap-6 overflow-x-auto scroll-smooth">
        {plugins.map((p) => (
          <Link key={p.id} href={`/products/${p.slug}`} className="group w-[calc(25%-18px)] min-w-[200px] shrink-0">
            <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <ProductArt
                product={p}
                sizes="260px"
                className="aspect-square w-full rounded-sm ring-1 ring-white/10 transition group-hover:ring-brand-soft"
              />
            </motion.div>
          </Link>
        ))}
      </div>
      {plugins.length > 4 && (
        <button
          type="button"
          onClick={scroll}
          aria-label={t.scrollPlugins}
          className="absolute top-1/2 -right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/80 text-white shadow-lg"
        >
          <ChevronRightIcon className="size-5" />
        </button>
      )}
    </div>
  );
}
