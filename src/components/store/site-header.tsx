import { getProducts, getSettings } from "@/lib/data/store";
import { HeaderNav } from "./header-nav";

export async function SiteHeader() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  const plugins = products.filter((p) => p.type === "plugin");

  return <HeaderNav plugins={plugins} discordUrl={settings.discordUrl} navItems={settings.navItems} />;
}
