import type { Metadata } from "next";
import { getAllFaqs } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { FaqEditor } from "@/components/admin/list-editors";
import { admin } from "@/lang/admin";

export const metadata: Metadata = { title: admin.meta.faqs + admin.meta.suffix };

export default async function AdminFaqsPage() {
  const faqs = await getAllFaqs();
  return (
    <>
      <AdminHeader title={admin.faqs.title} description={admin.faqs.description} />
      <div className="max-w-3xl">
        <FaqEditor faqs={faqs} />
      </div>
    </>
  );
}
