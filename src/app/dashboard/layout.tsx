import { Suspense } from "react";
import { PanelSidebar, PanelSidebarFallback, type PanelNavItem } from "@/components/panel/panel-sidebar";
import { PanelHeader, PanelHeaderFallback } from "@/components/panel/panel-header";
import { AdminLink } from "@/components/panel/admin-link";

const NAV: PanelNavItem[] = [
  { href: "/dashboard", label: "Home", icon: "home", exact: true },
  { href: "/dashboard/purchases", label: "My purchases", icon: "bag" },
  { href: "/dashboard/licenses", label: "Licenses", icon: "lock" },
];
const BOTTOM: PanelNavItem[] = [{ href: "/dashboard/settings", label: "Settings", icon: "settings" }];

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-screen bg-[#141414]">
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
        <div className="px-4 py-12 sm:px-14">{children}</div>
      </div>
    </div>
  );
}
