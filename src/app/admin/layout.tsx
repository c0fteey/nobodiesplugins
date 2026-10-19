import { Suspense } from "react";
import { PanelSidebar, PanelSidebarFallback, type PanelNavItem } from "@/components/panel/panel-sidebar";
import { PanelHeader, PanelHeaderFallback } from "@/components/panel/panel-header";
import { AdminGate } from "@/components/admin/admin-gate";

const NAV: PanelNavItem[] = [
  { href: "/admin", label: "Overview", icon: "home", exact: true },
  {
    label: "Catalog",
    icon: "package",
    items: [
      { href: "/admin/products", label: "Products", icon: "package" },
      { href: "/admin/docs", label: "Docs", icon: "book" },
      { href: "/admin/faqs", label: "FAQ", icon: "help" },
    ],
  },
  {
    label: "Sales",
    icon: "receipt",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "receipt" },
      { href: "/admin/coupons", label: "Coupons", icon: "ticket" },
      { href: "/admin/campaigns", label: "Campaigns", icon: "gift" },
    ],
  },
  {
    label: "Customers",
    icon: "users",
    items: [
      { href: "/admin/users", label: "Users", icon: "users" },
      { href: "/admin/messages", label: "Messages", icon: "inbox" },
    ],
  },
  {
    label: "Community",
    icon: "discord",
    items: [
      { href: "/admin/discord", label: "Discord", icon: "discord" },
      { href: "/admin/partners", label: "Partner servers", icon: "partners" },
    ],
  },
];
const BOTTOM: PanelNavItem[] = [
  { href: "/admin/settings", label: "Site settings", icon: "sliders" },
  { href: "/dashboard", label: "My dashboard", icon: "shield", exact: true },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen bg-[#141414]">
      {/* Reads the pathname, so it streams in on dynamic routes */}
      <Suspense fallback={<PanelSidebarFallback />}>
        <PanelSidebar items={NAV} bottom={BOTTOM} />
      </Suspense>
      <div className="min-w-0 flex-1">
        <Suspense fallback={<PanelHeaderFallback />}>
          <PanelHeader badge="ADMIN" />
        </Suspense>
        <div className="px-4 py-10 sm:px-14">
          {/* Role is re-checked against the DB before any admin content renders */}
          <Suspense fallback={<div className="shimmer h-96 rounded-xl" />}>
            <AdminGate>{children}</AdminGate>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
