import { Suspense } from "react";
import { PanelSidebar, PanelSidebarFallback, type PanelNavItem } from "@/components/panel/panel-sidebar";
import { PanelHeader, PanelHeaderFallback } from "@/components/panel/panel-header";
import { AdminLink } from "@/components/panel/admin-link";
import { site } from "@/lang/site";

const t = site.panel.nav;

const NAV: PanelNavItem[] = [
  { href: "/dashboard", label: t.home, icon: "home", exact: true },
  { href: "/dashboard/purchases", label: t.purchases, icon: "bag" },
  { href: "/dashboard/licenses", label: t.licenses, icon: "lock" },
];
const BOTTOM: PanelNavItem[] = [{ href: "/dashboard/settings", label: t.settings, icon: "settings" }];

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="min-h-screen bg-[#141414] md:flex">
      {/* Reads the pathname, so it streams in on dynamic routes */}
      <Suspense fallback={<PanelSidebarFallback />}>
        <PanelSidebar items={NAV} bottom={BOTTOM} />
      </Suspense>
      <div className="min-w-0 flex-1">
        <Suspense fallback={<PanelHeaderFallback />}>
          <PanelHeader />
        </Suspense>
        <Suspense>
          <AdminLink />
        </Suspense>
        <div className="px-4 py-6 sm:py-8 md:px-8 md:py-12 xl:px-14">{children}</div>
      </div>
    </div>
  );
}
