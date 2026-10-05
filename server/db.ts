import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { dataDir } from "./config.js";
import * as schema from "./schema.js";
export const sqlite = new Database(path.join(dataDir, "portal.sqlite"));
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");
export const db = drizzle(sqlite, { schema });
export function runMigrations() {
  migrate(db, { migrationsFolder: path.resolve("migrations") });
}
