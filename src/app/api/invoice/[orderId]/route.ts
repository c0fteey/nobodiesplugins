import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { getActionUser } from "@/lib/auth-guard";
import { formatDate, formatPrice } from "@/lib/format";

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Printable HTML invoice for one of the signed-in user's orders
export async function GET(request: Request, ctx: RouteContext<"/api/invoice/[orderId]">) {
  const { orderId } = await ctx.params;
  if (!z.uuid().safeParse(orderId).success) return new Response("Not found", { status: 404 });

  const user = await getActionUser();
  if (!user) return Response.redirect(new URL("/login", request.url));

  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.userId, user.id)) });
  if (!order) return new Response("Not found", { status: 404 });

  const items = await db
    .select({ name: products.name, priceCents: orderItems.priceCents })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, order.id));

  const rows = items
    .map((i) => `<tr><td>${escape(i.name)}</td><td style="text-align:right">${formatPrice(i.priceCents)}</td></tr>`)
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${order.id.slice(0, 8)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;color:#111}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:left}</style>
</head><body><h1>NOBODIES — Invoice</h1>
<p>Invoice #${order.id.slice(0, 8).toUpperCase()}<br>Date: ${formatDate(order.createdAt)}<br>Billed to: ${escape(user.email)}</p>
<table><thead><tr><th>Product</th><th style="text-align:right">Price</th></tr></thead><tbody>${rows}</tbody></table>
<p style="text-align:right">Discount: ${formatPrice(order.discountCents)}<br><b>Total: ${formatPrice(order.totalCents)}</b></p>
<script>window.print()</script></body></html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
