import { Suspense } from "react";
import { PanelSidebar, PanelSidebarFallback, type PanelNavItem } from "@/components/panel/panel-sidebar";
import { PanelHeader, PanelHeaderFallback } from "@/components/panel/panel-header";
import { AdminGate } from "@/components/admin/admin-gate";
import { admin } from "@/lang/admin";

const t = admin.nav;

const NAV: PanelNavItem[] = [
  { href: "/admin", label: t.overview, icon: "home", exact: true },
  {
    label: t.catalog,
    icon: "package",
    items: [
      { href: "/admin/products", label: t.products, icon: "package" },
      { href: "/admin/docs", label: t.docs, icon: "book" },
      { href: "/admin/faqs", label: t.faq, icon: "help" },
    ],
  },
  {
    label: t.sales,
    icon: "receipt",
    items: [
      { href: "/admin/orders", label: t.orders, icon: "receipt" },
      { href: "/admin/coupons", label: t.coupons, icon: "ticket" },
      { href: "/admin/campaigns", label: t.campaigns, icon: "gift" },
    ],
  },
  {
    label: t.customers,
    icon: "users",
    items: [
      { href: "/admin/users", label: t.users, icon: "users" },
      { href: "/admin/roles", label: t.roles, icon: "shield" },
      { href: "/admin/messages", label: t.messages, icon: "inbox" },
    ],
  },
  {
    label: t.community,
    icon: "discord",
    items: [
      { href: "/admin/discord", label: t.discord, icon: "discord" },
      { href: "/admin/partners", label: t.partners, icon: "partners" },
    ],
  },
];
const BOTTOM: PanelNavItem[] = [
  { href: "/admin/settings", label: t.settings, icon: "sliders" },
  { href: "/dashboard", label: t.myDashboard, icon: "shield", exact: true },
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
          <PanelHeader badge={t.badge} />
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
