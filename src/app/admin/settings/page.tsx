import type { Metadata } from "next";
import { getRawSettings } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Site settings · Admin" };

export default async function AdminSettingsPage() {
  const settings = await getRawSettings();
  return (
    <>
      <AdminHeader title="Site settings" description="Announcement banner, season copy and contact links." />
      <SettingsForm settings={settings} />
    </>
  );
}
