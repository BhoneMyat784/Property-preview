import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
export const production = process.env.NODE_ENV === "production";
export const dataDir = path.resolve(process.env.DATA_DIR || ".local");
fs.mkdirSync(dataDir, { recursive: true });
const secretFile = path.join(dataDir, "auth-secret");
if (!process.env.BETTER_AUTH_SECRET && production)
  throw new Error("BETTER_AUTH_SECRET is required in production");
if (!process.env.BETTER_AUTH_SECRET && !fs.existsSync(secretFile))
  fs.writeFileSync(secretFile, crypto.randomUUID() + crypto.randomUUID(), {
    mode: 0o600,
  });
export const authSecret =
  process.env.BETTER_AUTH_SECRET || fs.readFileSync(secretFile, "utf8");
export const appUrl = process.env.APP_URL || "http://localhost:8081";
export const apiUrl = process.env.API_URL || "http://localhost:3001";
export const port = Number(process.env.PORT || 3001);
