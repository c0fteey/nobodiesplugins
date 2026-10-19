import { z } from "zod";
import { verifyLicense } from "@/lib/licenses";

const bodySchema = z.object({
  key: z.string().trim().min(8).max(64),
  // Product slug (e.g. "nobodies-crates") or id
  product: z.string().trim().min(1).max(80),
  server: z.string().trim().max(120).optional(),
});

/**
 * License check for plugins:
 *   POST /api/licenses/verify  { "key": "NB-CRATES-…", "product": "nobodies-crates", "server": "Survival #1" }
 *   200 { "valid": true, "product": { … } }   |   403/404 { "valid": false, "reason": "…" }
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ valid: false, reason: "bad_request" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const result = await verifyLicense({ ...parsed.data, ip });
  const status = result.valid ? 200 : result.reason === "not_found" ? 404 : 403;
  return Response.json(result, { status, headers: { "cache-control": "no-store" } });
}
