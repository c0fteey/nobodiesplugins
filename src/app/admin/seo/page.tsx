import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { normalizeSeo } from "@/lib/seo";
import { AdminHeader } from "@/components/admin/ui";
import { SeoForm } from "@/components/admin/seo-form";
import { admin } from "@/lang/admin";

export const metadata: Metadata = { title: admin.meta.seo + admin.meta.suffix };

export default async function AdminSeoPage() {
  // Read uncached: the admin always edits the latest version
  const row = await db.query.settings.findFirst({ where: eq(settings.key, "seo") });
  return (
    <>
      <AdminHeader title={admin.seo.title} description={admin.seo.description} />
      <SeoForm seo={normalizeSeo(row?.value)} />
    </>
  );
}
