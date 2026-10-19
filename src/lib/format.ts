import { site } from "@/lang/site";

/** 1799 -> "€ 17,99" (store prices are integer cents). */
export function formatPrice(cents: number) {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/** 1799 -> "€17,99" (compact form used in totals). */
export function formatPriceCompact(cents: number) {
  return `€${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("tr-TR", { month: "short", day: "numeric", year: "numeric" });
}

export function timeAgo(date: Date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return site.time.today;
  if (days < 30) return site.time.daysAgo(days);
  return site.time.monthsAgo(Math.floor(days / 30));
}

export function slugify(value: string) {
  return value
    // Turkish dotless/dotted i don't decompose under NFKD
    .replace(/[ıİ]/g, "i")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const PRODUCT_TYPE_LABEL = site.productTypes;

/** Date -> "YYYY-MM-DDTHH:mm" in the browser's timezone, for <input type="datetime-local"> */
export function toDateTimeLocal(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
