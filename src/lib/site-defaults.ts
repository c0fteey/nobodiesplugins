import type { NavItem } from "@/db/schema";

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Products", href: "/products", visible: true },
  { label: "Addons", href: "/addons", visible: true },
  { label: "Docs", href: "/docs", visible: true },
  { label: "About Us", href: "/about", visible: true },
  { label: "Help", href: "/help", visible: true },
];
