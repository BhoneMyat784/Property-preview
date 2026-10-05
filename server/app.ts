import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import multer from "multer";
import { rateLimit } from "express-rate-limit";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import {
  and,
  or,
  eq,
  gte,
  lte,
  like,
  desc,
  asc,
  sql,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { db } from "./db.js";
import { auth } from "./auth.js";
import { appUrl, apiUrl, production } from "./config.js";
import { inboxDir } from "./mail.js";
import { storage } from "./storage.js";
import * as s from "./schema.js";
import {
  listingInput,
  searchInput,
  locationInput,
  statuses,
  type Listing,
  type Me,
} from "../src/shared/contracts.js";

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const fail = (status: number, message: string): never => {
  throw new HttpError(status, message);
};
const param = (req: Request, key: string) => String(req.params[key]);
async function viewer(req: Request): Promise<Me | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) return null;
  const u = db
    .select()
    .from(s.user)
    .where(eq(s.user.id, session.user.id))
    .get();
  if (!u) return null;
  const p = db
    .select()
    .from(s.profiles)
    .where(eq(s.profiles.userId, u.id))
    .get();
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    role: u.role === "admin" ? "admin" : "user",
    sellerType: p?.sellerType === "agent" ? "agent" : "owner",
  };
}
async function required(req: Request, admin = false) {
  const u = await viewer(req);
  if (!u) return fail(401, "Please sign in");
  if (!u.emailVerified) return fail(403, "Verify your email first");
  if (admin && u.role !== "admin") return fail(403, "Admin access required");
  return u;
}
function owned(id: string, u: Me) {
  const row = db.select().from(s.listings).where(eq(s.listings.id, id)).get();
  if (!row || row.ownerId !== u.id) return fail(404, "Listing not found");
  return row;
}
const joined = () =>
  db
    .select({
      listing: s.listings,
      city: s.cities,
      township: s.townships,
      user: s.user,
      profile: s.profiles,
    })
    .from(s.listings)
    .innerJoin(s.cities, eq(s.listings.cityId, s.cities.id))
    .innerJoin(s.townships, eq(s.listings.townshipId, s.townships.id))
    .innerJoin(s.user, eq(s.listings.ownerId, s.user.id))
    .leftJoin(s.profiles, eq(s.profiles.userId, s.user.id));
function hydrate(
  rows: ReturnType<ReturnType<typeof joined>["all"]>,
): Listing[] {
  return rows.map(
    (r) =>
      ({
        ...r.listing,
        ownerName: r.user.name,
        sellerType: r.profile?.sellerType === "agent" ? "agent" : "owner",
        cityNameEn: r.city.nameEn,
        cityNameMy: r.city.nameMy,
        townshipNameEn: r.township.nameEn,
        townshipNameMy: r.township.nameMy,
        photos: db
          .select()
          .from(s.photos)
          .where(eq(s.photos.listingId, r.listing.id))
          .orderBy(s.photos.position)
          .all()
          .map((p) => ({
            id: p.id,
            position: p.position,
            url: p.externalUrl || `/api/v1/photos/${p.id}`,
          })),
      }) as Listing,
  );
}
function validateLocation(
  input: { cityId: string; townshipId: string },
  existing?: typeof s.listings.$inferSelect,
) {
  const city = db
    .select()
    .from(s.cities)
    .where(eq(s.cities.id, input.cityId))
    .get();
  const township = db
    .select()
    .from(s.townships)
    .where(eq(s.townships.id, input.townshipId))
    .get();
  if (!city || !township || township.cityId !== city.id)
    fail(400, "Choose a township belonging to the selected city");
  if (
    (!city!.active || !township!.active) &&
    (existing?.cityId !== input.cityId ||
      existing?.townshipId !== input.townshipId)
  )
    fail(400, "This location is inactive");
}
function record(id: string, actor: string, action: string, reason?: string) {
  db.insert(s.moderation)
    .values({
      id: crypto.randomUUID(),
      listingId: id,
      actorId: actor,
      action,
      reason,
      createdAt: Date.now(),
    })
    .run();
}
function changed(row: typeof s.listings.$inferSelect, u: Me) {
  db.update(s.listings)
    .set({
      updatedAt: Date.now(),
      ...(row.status === "published"
        ? { status: "pending", rejectionReason: null }
        : {}),
    })
    .where(eq(s.listings.id, row.id))
    .run();
  if (row.status === "published")
    record(row.id, u.id, "resubmitted", "Published listing edited");
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: [appUrl, apiUrl], credentials: true }));
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    next();
  });
  app.use("/api", (req, _res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin &&
      ![appUrl, apiUrl].includes(req.headers.origin)
    )
      return next(new HttpError(403, "Origin not allowed"));
    next();
  });
  app.all("/api/auth/{*path}", toNodeHandler(auth));
  app.use(express.json({ limit: "100kb" }));
  app.use(
    "/api/v1",
    rateLimit({
      skip: () => process.env.NODE_ENV === "test",
      windowMs: 60000,
      limit: 240,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: {
          code: "RATE_LIMIT",
          message: "Too many requests. Please wait a minute and try again.",
        },
      },
    }),
  );
  app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/v1/me", async (req, res) => res.json(await required(req)));
  app.put("/api/v1/profile", async (req, res) => {
    const u = await required(req);
    const input = z
      .object({ sellerType: z.enum(["owner", "agent"]) })
      .parse(req.body);
    db.insert(s.profiles)
      .values({ userId: u.id, ...input })
      .onConflictDoUpdate({ target: s.profiles.userId, set: input })
      .run();
    res.json({ ...u, ...input });
  });
  app.get("/api/v1/locations", async (req, res) => {
    const all = req.query.includeInactive === "true";
    if (all) await required(req, true);
    res.json({
      cities: db
        .select()
        .from(s.cities)
        .where(all ? undefined : eq(s.cities.active, true))
        .orderBy(s.cities.nameEn)
        .all(),
      townships: db
        .select()
        .from(s.townships)
        .innerJoin(s.cities, eq(s.townships.cityId, s.cities.id))
        .where(
          all
            ? undefined
            : and(eq(s.townships.active, true), eq(s.cities.active, true)),
        )
        .orderBy(s.townships.nameEn)
        .all()
        .map((r) => r.townships),
    });
  });
  app.get("/api/v1/listings", (req, res) => {
    const input = searchInput.parse(req.query);
    const conditions: SQL[] = [eq(s.listings.status, "published")];
    if (input.q) {
      const q = `%${input.q.replace(/[\\%_]/g, "\\$&")}%`;
      conditions.push(
        or(
          sql`${s.listings.title} LIKE ${q} ESCAPE '\\'`,
          sql`${s.listings.description} LIKE ${q} ESCAPE '\\'`,
        )!,
      );
    }
    for (const k of [
      "transaction",
      "category",
      "cityId",
      "townshipId",
      "currency",
    ] as const)
      if (input[k]) conditions.push(eq(s.listings[k], input[k]!));
    if (input.minPrice !== undefined)
      conditions.push(gte(s.listings.price, input.minPrice));
    if (input.maxPrice !== undefined)
      conditions.push(lte(s.listings.price, input.maxPrice));
    const sqft = sql`CASE WHEN ${s.listings.areaUnit} = 'acre' THEN ${s.listings.area} * 43560 ELSE ${s.listings.area} END`;
    if (input.minArea !== undefined) conditions.push(gte(sqft, input.minArea));
    if (input.maxArea !== undefined) conditions.push(lte(sqft, input.maxArea));
    if (input.bedrooms !== undefined)
      conditions.push(gte(s.listings.bedrooms, input.bedrooms));
    const where = and(...conditions);
    const pageSize = 12;
    const total = db
      .select({ count: sql<number>`count(*)` })
      .from(s.listings)
      .where(where)
      .get()!.count;
    const order =
      input.sort === "price-asc"
        ? asc(s.listings.price)
        : input.sort === "price-desc"
          ? desc(s.listings.price)
          : desc(s.listings.createdAt);
    res.json({
      items: hydrate(
        joined()
          .where(where)
          .orderBy(order, desc(s.listings.id))
          .limit(pageSize)
          .offset((input.page - 1) * pageSize)
          .all(),
      ),
      total,
      page: input.page,
      pageSize,
    });
  });
  app.get("/api/v1/listings/:id", (req, res) => {
    const rows = joined()
      .where(
        and(
          eq(s.listings.id, param(req, "id")),
          eq(s.listings.status, "published"),
        ),
      )
      .all();
    if (!rows.length) return fail(404, "Listing not found");
    res.json(hydrate(rows)[0]);
  });
  app.get("/api/v1/favorites", async (req, res) => {
    const u = await required(req);
    const ids = db
      .select()
      .from(s.favorites)
      .where(eq(s.favorites.userId, u.id))
      .orderBy(desc(s.favorites.createdAt))
      .all();
    res.json(
      ids.flatMap((f) =>
        hydrate(
          joined()
            .where(
              and(
                eq(s.listings.id, f.listingId),
                eq(s.listings.status, "published"),
              ),
            )
            .all(),
        ),
      ),
    );
  });
  app.put("/api/v1/favorites/:id", async (req, res) => {
    const u = await required(req);
    const id = param(req, "id");
    if (
      !db
        .select()
        .from(s.listings)
        .where(and(eq(s.listings.id, id), eq(s.listings.status, "published")))
        .get()
    )
      fail(404, "Listing not found");
    db.insert(s.favorites)
      .values({
        id: crypto.randomUUID(),
        userId: u.id,
        listingId: id,
        createdAt: Date.now(),
      })
      .onConflictDoNothing()
      .run();
    res.json({ ok: true });
  });
  app.delete("/api/v1/favorites/:id", async (req, res) => {
    const u = await required(req);
    db.delete(s.favorites)
      .where(
        and(
          eq(s.favorites.userId, u.id),
          eq(s.favorites.listingId, param(req, "id")),
        ),
      )
      .run();
    res.json({ ok: true });
  });
  app.get("/api/v1/seller/listings", async (req, res) => {
    const u = await required(req);
    res.json(
      hydrate(
        joined()
          .where(eq(s.listings.ownerId, u.id))
          .orderBy(desc(s.listings.updatedAt))
          .all(),
      ),
    );
  });
  app.get("/api/v1/seller/listings/:id", async (req, res) => {
    const u = await required(req);
    owned(param(req, "id"), u);
    res.json(
      hydrate(
        joined()
          .where(eq(s.listings.id, param(req, "id")))
          .all(),
      )[0],
    );
  });
  app.post("/api/v1/seller/listings", async (req, res) => {
    const u = await required(req);
    const input = listingInput.parse(req.body);
    validateLocation(input);
    const id = crypto.randomUUID();
    db.transaction((tx) => {
      tx.insert(s.listings)
        .values({
          ...input,
          id,
          ownerId: u.id,
          status: "draft",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        .run();
      record(id, u.id, "created");
    });
    res
      .status(201)
      .json(hydrate(joined().where(eq(s.listings.id, id)).all())[0]);
  });
  app.put("/api/v1/seller/listings/:id", async (req, res) => {
    const u = await required(req);
    const row = owned(param(req, "id"), u);
    if (row.status === "archived")
      fail(409, "Archived listings cannot be edited");
    const input = listingInput.parse(req.body);
    validateLocation(input, row);
    db.transaction(() => {
      db.update(s.listings).set(input).where(eq(s.listings.id, row.id)).run();
      changed(row, u);
    });
    res.json(hydrate(joined().where(eq(s.listings.id, row.id)).all())[0]);
  });
  app.post("/api/v1/seller/listings/:id/submit", async (req, res) => {
    const u = await required(req);
    const row = owned(param(req, "id"), u);
    if (!["draft", "rejected"].includes(row.status))
      fail(409, "Only drafts or rejected listings can be submitted");
    listingInput.parse(row);
    validateLocation(row, row);
    if (!db.select().from(s.photos).where(eq(s.photos.listingId, row.id)).get())
      fail(400, "Add at least one photo before submitting");
    db.transaction(() => {
      db.update(s.listings)
        .set({
          status: "pending",
          rejectionReason: null,
          updatedAt: Date.now(),
        })
        .where(eq(s.listings.id, row.id))
        .run();
      record(row.id, u.id, "submitted");
    });
    res.json({ ok: true });
  });
  app.post("/api/v1/seller/listings/:id/archive", async (req, res) => {
    const u = await required(req);
    const row = owned(param(req, "id"), u);
    const { reason } = z
      .object({ reason: z.enum(["sold", "rented", "withdrawn"]) })
      .parse(req.body);
    if (
      (reason === "sold" && row.transaction !== "sale") ||
      (reason === "rented" && row.transaction !== "rent")
    )
      fail(400, "Archive reason does not match listing type");
    db.transaction(() => {
      db.update(s.listings)
        .set({
          status: "archived",
          archiveReason: reason,
          updatedAt: Date.now(),
        })
        .where(eq(s.listings.id, row.id))
        .run();
      record(row.id, u.id, "archived", reason);
    });
    res.json({ ok: true });
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  });
  app.post(
    "/api/v1/seller/listings/:id/photos",
    async (req, res, next) => {
      const u = await required(req);
      const row = owned(param(req, "id"), u);
      if (row.status === "archived")
        fail(409, "Archived listings cannot be edited");
      res.locals.u = u;
      next();
    },
    upload.array("photos", 10),
    async (req, res) => {
      const u = res.locals.u as Me;
      const row = owned(param(req, "id"), u);
      const files = req.files as Express.Multer.File[];
      const existing = db
        .select()
        .from(s.photos)
        .where(eq(s.photos.listingId, row.id))
        .all();
      if (!files?.length) fail(400, "Choose at least one photo");
      if (existing.length + files.length > 10)
        fail(400, "A listing can have at most 10 photos");
      const keys: string[] = [];
      try {
        for (const f of files) keys.push(await storage.write(f.buffer));
        db.transaction(() => {
          const current = owned(row.id, u);
          if (current.status === "archived")
            fail(409, "Archived listings cannot be edited");
          const count = db
            .select()
            .from(s.photos)
            .where(eq(s.photos.listingId, row.id))
            .all().length;
          if (count + keys.length > 10)
            fail(400, "A listing can have at most 10 photos");
          keys.forEach((key, i) =>
            db
              .insert(s.photos)
              .values({
                id: crypto.randomUUID(),
                listingId: row.id,
                storageKey: key,
                position: count + i,
              })
              .run(),
          );
          changed(current, u);
        });
      } catch (error) {
        await Promise.all(keys.map((k) => storage.remove(k)));
        throw error instanceof HttpError
          ? error
          : new HttpError(
              400,
              "Upload failed. Use valid JPEG, PNG or WebP photos up to 5 MB each.",
            );
      }
      res
        .status(201)
        .json(hydrate(joined().where(eq(s.listings.id, row.id)).all())[0]);
    },
  );
  app.put("/api/v1/seller/listings/:id/photos/order", async (req, res) => {
    const u = await required(req);
    const row = owned(param(req, "id"), u);
    if (row.status === "archived")
      fail(409, "Archived listings cannot be edited");
    const { ids } = z
      .object({ ids: z.array(z.string()).max(10) })
      .parse(req.body);
    const existing = db
      .select()
      .from(s.photos)
      .where(eq(s.photos.listingId, row.id))
      .all();
    if (
      ids.length !== existing.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !existing.some((p) => p.id === id))
    )
      fail(400, "Photo order must contain every photo exactly once");
    db.transaction(() => {
      ids.forEach((id, i) =>
        db
          .update(s.photos)
          .set({ position: i })
          .where(eq(s.photos.id, id))
          .run(),
      );
      changed(row, u);
    });
    res.json({ ok: true });
  });
  app.delete(
    "/api/v1/seller/listings/:id/photos/:photoId",
    async (req, res) => {
      const u = await required(req);
      const row = owned(param(req, "id"), u);
      if (row.status === "archived")
        fail(409, "Archived listings cannot be edited");
      const photo = db
        .select()
        .from(s.photos)
        .where(
          and(
            eq(s.photos.id, param(req, "photoId")),
            eq(s.photos.listingId, row.id),
          ),
        )
        .get();
      if (!photo) return fail(404, "Photo not found");
      db.transaction(() => {
        db.delete(s.photos).where(eq(s.photos.id, photo.id)).run();
        const remaining = db
          .select()
          .from(s.photos)
          .where(eq(s.photos.listingId, row.id))
          .orderBy(s.photos.position)
          .all();
        remaining.forEach((p, i) =>
          db
            .update(s.photos)
            .set({ position: i })
            .where(eq(s.photos.id, p.id))
            .run(),
        );
        changed(row, u);
      });
      if (photo.storageKey) await storage.remove(photo.storageKey);
      res.json({ ok: true });
    },
  );
  app.get("/api/v1/photos/:id", async (req, res) => {
    const photo = db
      .select()
      .from(s.photos)
      .innerJoin(s.listings, eq(s.photos.listingId, s.listings.id))
      .where(eq(s.photos.id, param(req, "id")))
      .get();
    if (!photo) return fail(404, "Photo not found");
    if (photo.listings.status !== "published") {
      const u = await viewer(req);
      if (!u || (u.id !== photo.listings.ownerId && u.role !== "admin"))
        fail(404, "Photo not found");
    }
    if (photo.photos.storageKey)
      // The path is selected from an authorized database row and validated by storage.
      // Allow our hidden .local data directory, never arbitrary user-supplied paths.
      res.sendFile(storage.path(photo.photos.storageKey), {
        dotfiles: "allow",
      });
    else if (photo.photos.externalUrl) res.redirect(photo.photos.externalUrl);
    else fail(404, "Photo not found");
  });
  app.get("/api/v1/admin/listings", async (req, res) => {
    await required(req, true);
    const status = z
      .enum([...statuses, "all"])
      .parse(req.query.status || "pending");
    res.json(
      hydrate(
        joined()
          .where(status === "all" ? undefined : eq(s.listings.status, status))
          .orderBy(desc(s.listings.updatedAt))
          .all(),
      ),
    );
  });
  app.post("/api/v1/admin/listings/:id/moderate", async (req, res) => {
    const u = await required(req, true);
    const input = z
      .object({
        action: z.enum(["approve", "reject", "remove"]),
        reason: z.string().trim().max(1000).optional(),
      })
      .parse(req.body);
    const id = param(req, "id");
    const row = db.select().from(s.listings).where(eq(s.listings.id, id)).get();
    if (!row) return fail(404, "Listing not found");
    if (input.action !== "remove" && row.status !== "pending")
      fail(409, "Only pending listings can be approved or rejected");
    if (input.action !== "approve" && !input.reason)
      fail(400, "A reason is required");
    if (
      input.action === "approve" &&
      !db.select().from(s.photos).where(eq(s.photos.listingId, id)).get()
    )
      fail(400, "A published listing requires a photo");
    const status =
      input.action === "approve"
        ? "published"
        : input.action === "reject"
          ? "rejected"
          : "archived";
    db.transaction(() => {
      db.update(s.listings)
        .set({
          status,
          rejectionReason: input.action === "reject" ? input.reason : null,
          archiveReason: input.action === "remove" ? "removed" : null,
          updatedAt: Date.now(),
        })
        .where(eq(s.listings.id, id))
        .run();
      record(id, u.id, input.action, input.reason);
    });
    res.json({ ok: true });
  });
  app.get("/api/v1/admin/listings/:id/history", async (req, res) => {
    await required(req, true);
    res.json(
      db
        .select()
        .from(s.moderation)
        .where(eq(s.moderation.listingId, param(req, "id")))
        .orderBy(desc(s.moderation.createdAt))
        .all(),
    );
  });
  for (const type of ["cities", "townships"] as const) {
    const table = type === "cities" ? s.cities : s.townships;
    app.post(`/api/v1/admin/${type}`, async (req, res) => {
      await required(req, true);
      const input = locationInput.parse(req.body);
      const id = crypto.randomUUID();
      if (type === "townships") {
        if (
          !input.cityId ||
          !db.select().from(s.cities).where(eq(s.cities.id, input.cityId)).get()
        )
          fail(400, "Choose an existing city");
        db.insert(s.townships)
          .values({ ...input, id, cityId: input.cityId! })
          .run();
      } else
        db.insert(s.cities)
          .values({
            id,
            nameEn: input.nameEn,
            nameMy: input.nameMy,
            active: input.active,
          })
          .run();
      res.status(201).json({ id });
    });
    app.put(`/api/v1/admin/${type}/:id`, async (req, res) => {
      await required(req, true);
      const input = locationInput.parse(req.body);
      const id = param(req, "id");
      if (!db.select().from(table).where(eq(table.id, id)).get())
        fail(404, "Location not found");
      // Township parent cities remain stable once created so existing listings stay consistent.
      if (type === "townships") {
        const original = db
          .select()
          .from(s.townships)
          .where(eq(s.townships.id, id))
          .get()!;
        if (input.cityId && input.cityId !== original.cityId)
          fail(400, "A township cannot be moved to another city");
      }
      db.update(table)
        .set({
          nameEn: input.nameEn,
          nameMy: input.nameMy,
          active: input.active,
        })
        .where(eq(table.id, id))
        .run();
      res.json({ ok: true });
    });
    app.delete(`/api/v1/admin/${type}/:id`, async (req, res) => {
      await required(req, true);
      const id = param(req, "id");
      if (!db.select().from(table).where(eq(table.id, id)).get())
        fail(404, "Location not found");
      const used = db
        .select()
        .from(s.listings)
        .where(
          type === "cities"
            ? eq(s.listings.cityId, id)
            : eq(s.listings.townshipId, id),
        )
        .get();
      const child =
        type === "cities"
          ? db
              .select()
              .from(s.townships)
              .where(eq(s.townships.cityId, id))
              .get()
          : null;
      if (used || child) {
        db.update(table).set({ active: false }).where(eq(table.id, id)).run();
        res.json({ deactivated: true });
      } else {
        db.delete(table).where(eq(table.id, id)).run();
        res.json({ deleted: true });
      }
    });
  }
  if (!production)
    app.get("/api/v1/dev/inbox", (req, res) => {
      if (
        !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
          req.socket.remoteAddress || "",
        )
      )
        return fail(403, "Local development only");
      res.json(
        fs.existsSync(inboxDir)
          ? fs
              .readdirSync(inboxDir)
              .filter((f) => f.endsWith(".json"))
              .map((f) =>
                JSON.parse(fs.readFileSync(path.join(inboxDir, f), "utf8")),
              )
              .sort((a, b) => b.createdAt - a.createdAt)
          : [],
      );
    });
  app.use("/api", (_req, _res) => fail(404, "Endpoint not found"));
  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError)
      return res.status(400).json({
        error: {
          code: "VALIDATION",
          message: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
          fields: error.flatten().fieldErrors,
        },
      });
    if (error instanceof HttpError)
      return res
        .status(error.status)
        .json({ error: { code: "REQUEST", message: error.message } });
    if (error instanceof multer.MulterError)
      return res.status(400).json({
        error: {
          code: "UPLOAD",
          message: "Use up to 10 photos, each no larger than 5 MB",
        },
      });
    if (error.message?.includes("UNIQUE constraint"))
      return res.status(409).json({
        error: { code: "CONFLICT", message: "This record already exists" },
      });
    console.error("Request failed:", error.message);
    res.status(500).json({
      error: {
        code: "SERVER",
        message: "Something went wrong. Please try again.",
      },
    });
  });
  return app;
}
