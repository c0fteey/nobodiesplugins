import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProducts, getProductById } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Edit product · Admin" };

// "/admin/products/new" creates, any other id edits
export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const isNew = id === "new";
  const [product, all] = await Promise.all([isNew ? null : getProductById(id), getAllProducts()]);
  if (!isNew && !product) notFound();

  const plugins = all.filter((p) => p.type === "plugin").map((p) => ({ id: p.id, name: p.name }));

  return (
    <>
      <AdminHeader title={isNew ? "New product" : `Edit ${product!.name}`} />
      <ProductForm product={product} plugins={plugins} />
    </>
  );
}
