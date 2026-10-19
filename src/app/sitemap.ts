import type { MetadataRoute } from "next";
import { getDocPages, getProducts } from "@/lib/data/store";
import { getSeo } from "@/lib/seo";
import { SEO_PAGES } from "@/lib/seo-pages";

// Public pages, every published product and doc; empty while the site is set to "not indexable"
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [seo, products, docs] = await Promise.all([getSeo(), getProducts(), getDocPages()]);
  if (!seo.indexable) return [];
  const base = seo.siteUrl.replace(/\/$/, "");
  const url = (path: string) => `${base}${path}`;

  return [
    ...Object.values(SEO_PAGES)
      .filter((path) => path !== "/login" && path !== "/register")
      .map((path) => ({ url: url(path), changeFrequency: "weekly" as const, priority: path === "/" ? 1 : 0.7 })),
    ...products.map((p) => ({ url: url(`/products/${p.slug}`), lastModified: p.updatedAt, priority: 0.8 })),
    ...docs.map((d) => ({ url: url(`/docs/${d.slug}`), lastModified: d.updatedAt, priority: 0.5 })),
  ];
}
