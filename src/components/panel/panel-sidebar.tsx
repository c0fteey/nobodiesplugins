"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  GiftIcon,
  CircleHelpIcon,
  HandshakeIcon,
  HomeIcon,
  InboxIcon,
  LockKeyholeIcon,
  LogOutIcon,
  MenuIcon,
  PackageIcon,
  ReceiptIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  ShoppingBagIcon,
  SlidersHorizontalIcon,
  TicketPercentIcon,
  UsersIcon,
} from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { DiscordIcon } from "@/components/brand/icons";
import { LogoMark } from "@/components/brand/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { site } from "@/lang/site";

const ICONS = {
  home: HomeIcon,
  bag: ShoppingBagIcon,
  lock: LockKeyholeIcon,
  settings: SettingsIcon,
  shield: ShieldIcon,
  package: PackageIcon,
  book: BookOpenIcon,
  help: CircleHelpIcon,
  receipt: ReceiptIcon,
  users: UsersIcon,
  inbox: InboxIcon,
  partners: HandshakeIcon,
  sliders: SlidersHorizontalIcon,
  ticket: TicketPercentIcon,
  gift: GiftIcon,
  discord: DiscordIcon,
  search: SearchIcon,
} as const;

type PanelIcon = keyof typeof ICONS;
export type PanelNavLink = { href: string; label: string; icon: PanelIcon; exact?: boolean };
/** Several pages behind one icon; hovering or clicking it opens a labelled flyout. */
export type PanelNavGroup = { label: string; icon: PanelIcon; items: PanelNavLink[] };
export type PanelNavItem = PanelNavLink | PanelNavGroup;

const itemCls = "relative flex h-14 w-full items-center justify-center transition";

function ActiveBar() {
  return (
    <motion.span
      layoutId="panel-active"
      className="absolute top-1 right-0 bottom-1 w-px bg-white"
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
    />
  );
}

export function PanelSidebar({ items, bottom }: { items: PanelNavItem[]; bottom: PanelNavItem[] }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (link: PanelNavLink) => (link.exact ? pathname === link.href : pathname.startsWith(link.href));

  const renderLink = (link: PanelNavLink) => {
    const Icon = ICONS[link.icon];
    const active = isActive(link);
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-label={link.label}
        title={link.label}
        className={cn(itemCls, active ? "text-white" : "text-white/70 hover:text-white")}
      >
        <Icon className="size-6" strokeWidth={1.6} />
        {active && <ActiveBar />}
      </Link>
    );
  };

  const renderGroup = (group: PanelNavGroup) => {
    const Icon = ICONS[group.icon];
    const active = group.items.some(isActive);
    return (
      <DropdownMenu key={group.label}>
        <DropdownMenuTrigger
          openOnHover
          delay={60}
          aria-label={group.label}
          className={cn(
            itemCls,
            "cursor-pointer outline-none data-popup-open:text-white",
            active ? "text-white" : "text-white/70 hover:text-white",
          )}
        >
          <Icon className="size-6" strokeWidth={1.6} />
          {/* Small notch: this icon holds more pages */}
          <span aria-hidden className="absolute right-3 bottom-3.5 size-1 rounded-full bg-current opacity-50 sm:right-6" />
          {active && <ActiveBar />}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={6} className="w-52 border-0 bg-[#1c1c1e] p-1.5">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 pt-1 pb-1.5 text-[10px] font-bold tracking-[0.14em] uppercase">{group.label}</DropdownMenuLabel>
            {group.items.map((link) => {
              const LinkIcon = ICONS[link.icon];
              return (
                <DropdownMenuItem
                  key={link.href}
                  render={<Link href={link.href} />}
                  className={cn("cursor-pointer gap-2.5 px-2 py-2", isActive(link) && "bg-brand/20 text-white")}
                >
                  <LinkIcon className="size-4" strokeWidth={1.8} />
                  {link.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderItem = (item: PanelNavItem) => ("items" in item ? renderGroup(item) : renderLink(item));

  // Phones: labelled list in a sheet, groups flattened under small headings
  const mobileLink = (link: PanelNavLink) => {
    const Icon = ICONS[link.icon];
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => setMenuOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition",
          isActive(link) ? "bg-brand/20 text-white" : "text-white/75 hover:bg-white/5 hover:text-white",
        )}
      >
        <Icon className="size-5" strokeWidth={1.7} />
        {link.label}
      </Link>
    );
  };
  const mobileItem = (item: PanelNavItem) =>
    "items" in item ? (
      <div key={item.label} className="pt-3">
        <p className="px-3 pb-1 text-[10px] font-bold tracking-[0.14em] text-white/40 uppercase">{item.label}</p>
        {item.items.map(mobileLink)}
      </div>
    ) : (
      mobileLink(item)
    );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/5 bg-[#151515] px-4 md:hidden">
        <Link href="/" aria-label={site.panel.nav.storeHome}>
          <LogoMark className="text-2xl [--logo-cut:#151515]" />
        </Link>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger aria-label={site.nav.openMenu} className="grid size-10 place-items-center rounded-md text-white/80 hover:bg-white/5">
            <MenuIcon className="size-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-xs gap-0 border-white/10 bg-[#151515] p-0">
            <SheetTitle className="flex h-14 shrink-0 items-center border-b border-white/5 px-5">
              <LogoMark className="text-2xl [--logo-cut:#151515]" />
            </SheetTitle>
            <nav className="flex-1 overflow-y-auto p-3">
              {items.map(mobileItem)}
              <div className="my-3 border-t border-white/5" />
              {bottom.map(mobileItem)}
              <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-white/75 hover:bg-white/5">
                <ArrowLeftIcon className="size-5" strokeWidth={1.7} /> {site.panel.nav.backToStore}
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => signOutAction())}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-red-300 hover:bg-white/5 disabled:opacity-50"
              >
                <LogOutIcon className="size-5" strokeWidth={1.7} /> {site.panel.nav.logout}
              </button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    <aside className="sticky top-0 hidden h-dvh w-[88px] shrink-0 flex-col items-center border-r border-white/5 bg-[#151515] py-6 md:flex lg:w-[104px]">
      <Link href="/" aria-label={site.panel.nav.storeHome} className="mb-12">
        <LogoMark className="text-[28px] [--logo-cut:#151515]" />
      </Link>
      <nav className="flex w-full flex-1 flex-col">{items.map(renderItem)}</nav>
      <nav className="flex w-full flex-col">
        {bottom.map(renderItem)}
        <Link href="/" aria-label={site.panel.nav.backToStore} title={site.panel.nav.backToStore} className="flex h-14 items-center justify-center text-white/70 transition hover:text-white">
          <ArrowLeftIcon className="size-6" strokeWidth={1.6} />
        </Link>
        <button
          type="button"
          aria-label={site.panel.nav.logout}
          title={site.panel.nav.logout}
          disabled={pending}
          onClick={() => startTransition(() => signOutAction())}
          className="flex h-14 items-center justify-center text-white/70 transition hover:text-white disabled:opacity-50"
        >
          <LogOutIcon className="size-6" strokeWidth={1.6} />
        </button>
      </nav>
    </aside>
    </>
  );
}

export function PanelSidebarFallback() {
  return (
    <>
      <div className="h-14 border-b border-white/5 bg-[#151515] md:hidden" />
      <div className="sticky top-0 hidden h-dvh w-[88px] shrink-0 border-r border-white/5 bg-[#151515] md:block lg:w-[104px]" />
    </>
  );
}
