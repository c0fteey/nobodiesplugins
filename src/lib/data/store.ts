import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  docPages,
  faqs,
  partners,
  products,
  settings,
  type Announcement,
  type Product,
  type SiteSettings,
} from "@/db/schema";
import { DEFAULT_NAV_ITEMS } from "@/lib/site-defaults";

export { DEFAULT_NAV_ITEMS };

export const DEFAULT_SETTINGS: SiteSettings = {
  announcements: [
    {
      enabled: true,
      title: "CADILAR BAYRAMI SEZONU BAŞLADI!",
      badge: "%10 indirim",
      text: "sınırlı süreli kampanya!",
      cta: "HEMEN %10 KAZAN",
      href: "/products",
    },
  ],
  discountPercent: 10,
  seasonLabel: "Cadılar Bayramı",
  discordUrl: "https://discord.com",
  supportEmail: "support@nobodies.gg",
  navItems: DEFAULT_NAV_ITEMS,
  footer: {
    tagline: "Ciddi Minecraft sunucuları için premium eklentiler.",
    showDiscord: true,
    showTwitter: true,
    showInstagram: true,
  },
};

// Public catalog: everything published, ordered for display
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  return db
    .select()
    .from(products)
    .where(eq(products.published, true))
    .orderBy(asc(products.sortOrder), desc(products.createdAt));
}

export async function getProductBySlug(slug: string) {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag("settings");
  cacheLife("hours");

  const row = await db.query.settings.findFirst({ where: eq(settings.key, "site") });
  return normalizeSettings(row?.value);
}

/** Merges stored settings over the defaults; upgrades the old single-banner shape. */
export function normalizeSettings(value: unknown): SiteSettings {
  const stored = (value ?? {}) as Partial<SiteSettings> & { announcement?: Omit<Announcement, "href"> };
  const announcements =
    stored.announcements ??
    (stored.announcement ? [{ ...stored.announcement, href: "/products" }] : DEFAULT_SETTINGS.announcements);
  const { announcement: _legacy, ...rest } = stored;
  void _legacy;
  return { ...DEFAULT_SETTINGS, ...rest, announcements };
}

/** Active campaigns with their trigger/reward ids; time windows are checked by callers. */
export async function getCampaigns() {
  "use cache";
  cacheTag("campaigns");
  cacheLife("minutes");

  return db.select().from(campaigns).where(eq(campaigns.active, true));
}

export async function getPartners() {
  "use cache";
  cacheTag("partners");
  cacheLife("hours");

  return db.select().from(partners).orderBy(asc(partners.sortOrder));
}

export async function getFaqs() {
  "use cache";
  cacheTag("faqs");
  cacheLife("hours");

  return db.select().from(faqs).where(eq(faqs.published, true)).orderBy(asc(faqs.sortOrder));
}

export async function getDocPages() {
  "use cache";
  cacheTag("docs");
  cacheLife("hours");

  return db
    .select()
    .from(docPages)
    .where(eq(docPages.published, true))
    .orderBy(asc(docPages.sortOrder), asc(docPages.title));
}

export async function getDocBySlug(slug: string) {
  "use cache";
  cacheTag("docs");
  cacheLife("hours");

  return (
    (await db.query.docPages.findFirst({
      where: and(eq(docPages.slug, slug), eq(docPages.published, true)),
    })) ?? null
  );
}
