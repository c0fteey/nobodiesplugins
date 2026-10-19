import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from "../src/db/schema";

// Usage: npm run make-admin -- someone@example.com
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Usage: npm run make-admin -- <email>");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  const db = drizzle(pool);
  const updated = await db.update(users).set({ role: "admin" }).where(eq(users.email, email)).returning({ id: users.id });
  await pool.end();

  if (updated.length === 0) throw new Error(`No user with email ${email}. Register on the site first.`);
  console.log(`${email} is now an admin. Log out and back in to refresh the session.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
