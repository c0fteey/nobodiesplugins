import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getActionUser } from "@/lib/auth-guard";
import { getOwnedProductIds } from "@/lib/data/account";
import { site } from "@/lang/site";

// Hands out a product's download link only to people who own it
export async function GET(request: Request, ctx: RouteContext<"/api/download/[productId]">) {
  const { productId } = await ctx.params;
  if (!z.uuid().safeParse(productId).success) return new Response(site.api.notFound, { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });

  const user = await getActionUser();
  if (!user) return Response.redirect(new URL("/login", request.url));

  const owned = await getOwnedProductIds(user.id);
  if (!owned.has(productId) && user.role !== "admin") {
    return new Response(site.api.notOwned, { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
  if (!product) return new Response(site.api.notFound, { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  if (!product.downloadUrl) {
    return new Response(site.api.noDownload(product.name), {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return Response.redirect(product.downloadUrl, 302);
}
