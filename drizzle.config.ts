import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./server/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: { url: `${process.env.DATA_DIR || ".local"}/portal.sqlite` },
});
