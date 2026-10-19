import type { Metadata } from "next";
import { getAllFaqs } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { FaqEditor } from "@/components/admin/list-editors";

export const metadata: Metadata = { title: "FAQ · Admin" };

export default async function AdminFaqsPage() {
  const faqs = await getAllFaqs();
  return (
    <>
      <AdminHeader title="FAQ" description="Shown on the Help and Docs pages." />
      <div className="max-w-3xl">
        <FaqEditor faqs={faqs} />
      </div>
    </>
  );
}
