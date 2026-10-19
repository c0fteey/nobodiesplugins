import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { getActionUser } from "@/lib/auth-guard";
import { formatDate, formatPrice } from "@/lib/format";
import { site } from "@/lang/site";

const t = site.api.invoice;

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Printable HTML invoice for one of the signed-in user's orders
export async function GET(request: Request, ctx: RouteContext<"/api/invoice/[orderId]">) {
  const { orderId } = await ctx.params;
  if (!z.uuid().safeParse(orderId).success) return new Response(site.api.notFound, { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });

  const user = await getActionUser();
  if (!user) return Response.redirect(new URL("/login", request.url));

  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.userId, user.id)) });
  if (!order) return new Response(site.api.notFound, { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });

  const items = await db
    .select({ name: products.name, priceCents: orderItems.priceCents })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, order.id));

  const rows = items
    .map((i) => `<tr><td>${escape(i.name)}</td><td style="text-align:right">${formatPrice(i.priceCents)}</td></tr>`)
    .join("");

  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${t.title(order.id.slice(0, 8))}</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;color:#111}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:left}</style>
</head><body><h1>${t.heading}</h1>
<p>${t.number} #${order.id.slice(0, 8).toUpperCase()}<br>${t.date}: ${formatDate(order.createdAt)}<br>${t.billedTo}: ${escape(user.email)}</p>
<table><thead><tr><th>${t.product}</th><th style="text-align:right">${t.price}</th></tr></thead><tbody>${rows}</tbody></table>
<p style="text-align:right">${t.discount}: ${formatPrice(order.discountCents)}<br><b>${t.total}: ${formatPrice(order.totalCents)}</b></p>
<script>window.print()</script></body></html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
