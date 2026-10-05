import { eq } from "drizzle-orm";
import { db, runMigrations, sqlite } from "./db.js";
import { user } from "./schema.js";
runMigrations();
const email = process.argv[2]?.trim().toLowerCase();
if (!email)
  throw new Error("Usage: npm run admin:grant -- verified-account@example.com");
const account = db.select().from(user).where(eq(user.email, email)).get();
if (!account?.emailVerified)
  throw new Error(
    "Create this account and verify its email before granting admin access",
  );
db.update(user).set({ role: "admin" }).where(eq(user.id, account.id)).run();
sqlite.close();
console.log("Admin access granted to the verified account.");
