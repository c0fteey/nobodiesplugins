import { connection } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function GET() {
  await connection();
  const { rows } = await db.execute<{ now: string; version: string }>(
    sql`select now() as now, version() as version`,
  );
  return Response.json({ ok: true, ...rows[0] });
}
