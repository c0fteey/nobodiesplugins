import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProducts, getDocById } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { DocForm } from "@/components/admin/doc-form";

export const metadata: Metadata = { title: "Edit doc · Admin" };

export default async function EditDocPage({ params }: PageProps<"/admin/docs/[id]">) {
  const { id } = await params;
  const isNew = id === "new";
  const [doc, products] = await Promise.all([isNew ? null : getDocById(id), getAllProducts()]);
  if (!isNew && !doc) notFound();

  return (
    <>
      <AdminHeader title={isNew ? "New doc page" : `Edit ${doc!.title}`} />
      <DocForm
        doc={doc}
        plugins={products.filter((p) => p.type === "plugin").map((p) => ({ id: p.id, name: p.name }))}
      />
    </>
  );
}
