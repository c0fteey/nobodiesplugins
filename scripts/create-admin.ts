import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from "../src/db/schema";

// Usage: npm run create-admin -- <email> <password>
// Creates the account, or resets the password and promotes it if it already exists.
async function main() {
  const [rawEmail, password] = process.argv.slice(2);
  const email = rawEmail?.trim().toLowerCase();
  if (!email || !password) throw new Error("Usage: npm run create-admin -- <email> <password>");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  const db = drizzle(pool);
  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .insert(users)
    .values({ email, name: email.split("@")[0], passwordHash, role: "admin" })
    .onConflictDoUpdate({ target: users.email, set: { passwordHash, role: "admin" } });
  await pool.end();

  console.log(`${email} is an admin and can log in now.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
