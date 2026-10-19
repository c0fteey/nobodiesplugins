import type { MetadataRoute } from "next";
import { getSeo } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeo();
  const base = seo.siteUrl.replace(/\/$/, "");
  return seo.indexable
    ? {
        // Account and admin pages are private; everything else may be crawled
        rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/api"] },
        sitemap: `${base}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
