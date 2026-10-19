import "server-only";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { site } from "@/lang/site";
import { SEO_PAGES, type PageSeo, type SeoPageKey, type SeoSettings } from "./seo-pages";

const p = site.meta.pages;

export const DEFAULT_SEO: SeoSettings = {
  siteName: "NOBODIES",
  siteUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000",
  titleTemplate: site.meta.titleTemplate,
  defaultDescription: site.meta.description,
  defaultImage: "",
  twitterHandle: "",
  indexable: true,
  pages: {
    home: { title: site.meta.title, description: "", image: "" },
    products: { title: p.products, description: "", image: "" },
    addons: { title: p.addons, description: "", image: "" },
    docs: { title: p.docs, description: "", image: "" },
    about: { title: p.about, description: "", image: "" },
    help: { title: p.help, description: "", image: "" },
    login: { title: p.login, description: "", image: "" },
    register: { title: p.register, description: "", image: "" },
  },
};

/** Stored SEO settings over the defaults (new pages/fields fall back cleanly). */
export function normalizeSeo(value: unknown): SeoSettings {
  const stored = (value ?? {}) as Partial<SeoSettings>;
  const pages = Object.fromEntries(
    (Object.keys(SEO_PAGES) as SeoPageKey[]).map((key) => [key, { ...DEFAULT_SEO.pages[key], ...stored.pages?.[key] }]),
  ) as Record<SeoPageKey, PageSeo>;
  return { ...DEFAULT_SEO, ...stored, pages };
}

export async function getSeo(): Promise<SeoSettings> {
  "use cache";
  cacheTag("seo");
  cacheLife("hours");
  const row = await db.query.settings.findFirst({ where: eq(settings.key, "seo") });
  return normalizeSeo(row?.value);
}

/** Open Graph + Twitter fields shared by every page. */
function preview(seo: SeoSettings, title: string, description: string, image: string, path?: string): Metadata {
  const images = image || seo.defaultImage ? [{ url: image || seo.defaultImage }] : undefined;
  return {
    description,
    // Root defaults pass no path, so pages without their own metadata never inherit a wrong canonical
    alternates: path ? { canonical: path } : undefined,
    openGraph: { title, description, url: path, siteName: seo.siteName, locale: "tr_TR", type: "website", images },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: images?.map((i) => i.url),
      site: seo.twitterHandle || undefined,
    },
  };
}

/** Metadata for one of the editable pages. */
export async function pageMetadata(key: SeoPageKey): Promise<Metadata> {
  const seo = await getSeo();
  const page = seo.pages[key];
  const description = page.description || seo.defaultDescription;
  // The home page title is used as is; others go through the template
  const title = key === "home" ? { absolute: page.title || seo.siteName } : page.title;
  const shown = key === "home" ? page.title || seo.siteName : seo.titleTemplate.replace("%s", page.title);
  return { title, ...preview(seo, shown, description, page.image, SEO_PAGES[key]) };
}

/** Metadata for a content page (product, doc) built from its own fields. */
export async function contentMetadata(input: { title: string; description: string; image?: string | null; path: string }): Promise<Metadata> {
  const seo = await getSeo();
  const description = input.description || seo.defaultDescription;
  return { title: input.title, ...preview(seo, seo.titleTemplate.replace("%s", input.title), description, input.image ?? "", input.path) };
}

/** Site-wide defaults for the root layout. */
export async function rootMetadata(): Promise<Metadata> {
  const seo = await getSeo();
  let base: URL | undefined;
  try {
    base = new URL(seo.siteUrl);
  } catch {
    base = undefined;
  }
  return {
    metadataBase: base,
    applicationName: seo.siteName,
    title: { default: seo.pages.home.title || seo.siteName, template: seo.titleTemplate },
    description: seo.defaultDescription,
    robots: seo.indexable ? { index: true, follow: true } : { index: false, follow: false },
    ...preview(seo, seo.pages.home.title || seo.siteName, seo.defaultDescription, seo.defaultImage),
  };
}
