import type { NavItem } from "@/db/schema";
import { site } from "@/lang/site";

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: site.nav.products, href: "/products", visible: true },
  { label: site.nav.addons, href: "/addons", visible: true },
  { label: site.nav.docs, href: "/docs", visible: true },
  { label: site.nav.about, href: "/about", visible: true },
  { label: site.nav.help, href: "/help", visible: true },
];
