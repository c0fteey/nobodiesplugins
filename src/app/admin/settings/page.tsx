import type { Metadata } from "next";
import { getRawSettings } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { admin } from "@/lang/admin";

export const metadata: Metadata = { title: admin.meta.settings + admin.meta.suffix };

export default async function AdminSettingsPage() {
  const settings = await getRawSettings();
  return (
    <>
      <AdminHeader title={admin.settings.title} description={admin.settings.description} />
      <SettingsForm settings={settings} />
    </>
  );
}
