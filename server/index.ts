import { createApp } from "./app.js";
import { db, runMigrations } from "./db.js";
import { listings } from "./schema.js";
import { and, eq } from "drizzle-orm";
import { port, production, appUrl, apiUrl } from "./config.js";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { createRequire } from "node:module";
runMigrations();
const app = createApp();
if (production || process.env.SERVE_WEB === "true") {
  if (production && !process.env.SMTP_URL)
    throw new Error("Configure SMTP_URL before starting production");
  if (production && appUrl !== apiUrl)
    throw new Error(
      "Production APP_URL and API_URL must use the same public origin",
    );
  if (!fs.existsSync("dist/server"))
    throw new Error("Run npm run build before starting production");
  // SDK 57's Node adapter loads Metro's CommonJS exports using require.
  const { createRequestHandler } = createRequire(import.meta.url)(
    "expo-server/adapter/express",
  ) as typeof import("expo-server/adapter/express");
  app.use(express.static(path.resolve("dist/client"), { index: false }));
  app.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  const renderConfig = { build: path.resolve("dist/server") };
  // The SDK 57 renderer returns HTML with status 200 even for missing loader data.
  // Set the HTTP status at the adapter boundary while retaining the localized page.
  app.get("/properties/:id", (req, res, next) => {
    const id = String(req.params.id);
    return createRequestHandler(renderConfig, {
      beforeHTMLResponse(response) {
        const visible = db
          .select({ id: listings.id })
          .from(listings)
          .where(and(eq(listings.id, id), eq(listings.status, "published")))
          .get();
        if (!visible) {
          response.status = 404;
          response.headers.set("X-Robots-Tag", "noindex");
        }
        return response;
      },
    })(req, res, next);
  });
  app.use(createRequestHandler(renderConfig));
}
app.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(
    `Property Portal API listening on port ${port}${production ? " (web included)" : ""}`,
  ),
);
