import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import Database from "better-sqlite3";
import sharp from "sharp";
import { eq } from "drizzle-orm";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "portal-test-"));
process.env.DATA_DIR = dir;
process.env.BETTER_AUTH_SECRET =
  "test-only-secret-that-is-at-least-thirty-two-characters";
process.env.APP_URL = "http://localhost:8081";
process.env.API_URL = "http://localhost:3001";
let app: ReturnType<(typeof import("../server/app.js"))["createApp"]>;
let db: (typeof import("../server/db.js"))["db"];
let sqlite: (typeof import("../server/db.js"))["sqlite"];
let s: typeof import("../server/schema.js");
let owner: ReturnType<typeof request.agent>;
let other: ReturnType<typeof request.agent>;
let admin: ReturnType<typeof request.agent>;
let ownerId: string;
let photo: Buffer;
let persistedId: string;
let ownerCookie = "";
const input = {
  title: "A beautiful test home",
  description: "A spacious test property with a garden, suitable for a family.",
  transaction: "sale",
  category: "house",
  cityId: "yangon",
  townshipId: "bahan",
  address: "Test address in Bahan",
  currency: "MMK",
  price: 200000000,
  area: 1400,
  areaUnit: "sqft",
  bedrooms: 3,
  bathrooms: 2,
  phone: "+959123456789",
  viber: "+959123456789",
};
async function account(email: string, role = "user") {
  const agent = request.agent(app);
  const signup = await agent
    .post("/api/auth/sign-up/email")
    .send({ email, password: "Testing123!", name: "Test User", role: "admin" });
  expect(signup.status).toBe(200);
  const u = db.select().from(s.user).where(eq(s.user.email, email)).get()!;
  expect(u.role).toBe("user");
  db.update(s.user)
    .set({ emailVerified: true, role })
    .where(eq(s.user.id, u.id))
    .run();
  const signin = await agent
    .post("/api/auth/sign-in/email")
    .send({ email, password: "Testing123!" });
  expect(signin.status).toBe(200);
  return {
    agent,
    id: u.id,
    cookie: (signin.headers["set-cookie"] as unknown as string[])
      .map((c) => c.split(";")[0])
      .join("; "),
  };
}
async function draft(overrides: Record<string, unknown> = {}) {
  const response = await owner
    .post("/api/v1/seller/listings")
    .send({ ...input, ...overrides });
  expect(response.status).toBe(201);
  return response.body.id as string;
}
async function upload(id: string) {
  const response = await owner
    .post(`/api/v1/seller/listings/${id}/photos`)
    .attach("photos", photo, "home.png");
  expect(response.status).toBe(201);
  return response.body.photos[0].id as string;
}
async function publish(id: string) {
  expect(
    (await owner.post(`/api/v1/seller/listings/${id}/submit`).send({})).status,
  ).toBe(200);
  expect(
    (
      await admin
        .post(`/api/v1/admin/listings/${id}/moderate`)
        .send({ action: "approve" })
    ).status,
  ).toBe(200);
}
beforeAll(async () => {
  const database = await import("../server/db.js");
  db = database.db;
  sqlite = database.sqlite;
  database.runMigrations();
  s = await import("../server/schema.js");
  app = (await import("../server/app.js")).createApp();
  db.insert(s.cities)
    .values([
      { id: "yangon", nameEn: "Yangon", nameMy: "ရန်ကုန်" },
      { id: "mandalay", nameEn: "Mandalay", nameMy: "မန္တလေး" },
    ])
    .run();
  db.insert(s.townships)
    .values([
      { id: "bahan", cityId: "yangon", nameEn: "Bahan", nameMy: "ဗဟန်း" },
      {
        id: "chanayethazan",
        cityId: "mandalay",
        nameEn: "Chanayethazan",
        nameMy: "ချမ်းအေးသာစံ",
      },
    ])
    .run();
  const o = await account("owner@test.local");
  owner = o.agent;
  ownerId = o.id;
  ownerCookie = o.cookie;
  other = (await account("other@test.local")).agent;
  admin = (await account("admin@test.local", "admin")).agent;
  photo = await sharp({
    create: { width: 100, height: 100, channels: 3, background: "#88aa88" },
  })
    .png()
    .toBuffer();
});
afterAll(() => {
  sqlite?.close();
  fs.rmSync(dir, { recursive: true, force: true });
});
describe("account lifecycle and permissions", () => {
  it("requires email verification and supports verification, login, reset, and logout", async () => {
    const agent = request.agent(app);
    expect(
      (
        await agent.post("/api/auth/sign-up/email").send({
          email: "verify@test.local",
          password: "Original123!",
          name: "Verify User",
          callbackURL: "http://localhost:8081/auth",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await agent
          .post("/api/auth/sign-in/email")
          .send({ email: "verify@test.local", password: "Original123!" })
      ).status,
    ).toBe(403);
    const inbox = (await request(app).get("/api/v1/dev/inbox")).body;
    const verification = inbox.find(
      (m: any) =>
        m.to === "verify@test.local" && m.subject === "Verify your email",
    );
    expect(verification).toBeTruthy();
    const url = new URL(verification.url);
    const verified = await agent.get(url.pathname + url.search);
    expect([200, 302]).toContain(verified.status);
    expect(
      (
        await agent
          .post("/api/auth/sign-in/email")
          .send({ email: "verify@test.local", password: "Original123!" })
      ).status,
    ).toBe(200);
    expect((await agent.get("/api/v1/me")).body.emailVerified).toBe(true);
    expect(
      (
        await agent.post("/api/auth/request-password-reset").send({
          email: "verify@test.local",
          redirectTo: "http://localhost:8081/auth?mode=reset",
        })
      ).status,
    ).toBe(200);
    const messages = (await request(app).get("/api/v1/dev/inbox")).body;
    const reset = messages.find(
      (m: any) =>
        m.to === "verify@test.local" && m.subject === "Reset your password",
    );
    const resetURL = new URL(reset.url);
    const token = resetURL.pathname.split("/").pop();
    expect(
      (
        await agent
          .post("/api/auth/reset-password")
          .send({ token, newPassword: "Changed123!" })
      ).status,
    ).toBe(200);
    expect(
      (
        await agent
          .post("/api/auth/sign-in/email")
          .send({ email: "verify@test.local", password: "Changed123!" })
      ).status,
    ).toBe(200);
    expect((await agent.post("/api/auth/sign-out").send({})).status).toBe(200);
    expect((await agent.get("/api/v1/me")).status).toBe(401);
  });
  it("blocks anonymous writes, other owners, forged roles, and untrusted origins", async () => {
    expect(
      (await request(app).post("/api/v1/seller/listings").send(input)).status,
    ).toBe(401);
    const id = await draft();
    expect(
      (await other.put(`/api/v1/seller/listings/${id}`).send(input)).status,
    ).toBe(404);
    expect(
      (
        await other
          .post(`/api/v1/seller/listings/${id}/photos`)
          .attach("photos", photo, "photo.png")
      ).status,
    ).toBe(404);
    expect((await owner.get("/api/v1/admin/listings")).status).toBe(403);
    expect(
      (
        await owner
          .put("/api/v1/profile")
          .send({ sellerType: "agent", role: "admin" })
      ).status,
    ).toBe(200);
    expect((await owner.get("/api/v1/me")).body.role).toBe("user");
    expect(
      (
        await owner
          .post("/api/v1/seller/listings")
          .set("Origin", "https://evil.example")
          .send(input)
      ).status,
    ).toBe(403);
  });
});
describe("listing lifecycle", () => {
  it("hides drafts and pending listings and protects their photos", async () => {
    const id = await draft();
    const pid = await upload(id);
    expect((await request(app).get(`/api/v1/listings/${id}`)).status).toBe(404);
    expect((await request(app).get(`/api/v1/photos/${pid}`)).status).toBe(404);
    expect((await owner.get(`/api/v1/photos/${pid}`)).status).toBe(200);
    expect(
      (await owner.post(`/api/v1/seller/listings/${id}/submit`).send({}))
        .status,
    ).toBe(200);
    expect(
      (await request(app).get("/api/v1/listings")).body.items.some(
        (p: any) => p.id === id,
      ),
    ).toBe(false);
    expect((await admin.get(`/api/v1/photos/${pid}`)).status).toBe(200);
  });
  it("requires photos and validates category-specific fields and location parents", async () => {
    const id = await draft();
    expect(
      (await owner.post(`/api/v1/seller/listings/${id}/submit`).send({}))
        .status,
    ).toBe(400);
    expect(
      (
        await owner
          .post("/api/v1/seller/listings")
          .send({ ...input, category: "land" })
      ).status,
    ).toBe(400);
    expect(
      (
        await owner
          .post("/api/v1/seller/listings")
          .send({ ...input, townshipId: "chanayethazan" })
      ).status,
    ).toBe(400);
    expect(
      (
        await owner
          .post("/api/v1/seller/listings")
          .send({ ...input, price: -1 })
      ).status,
    ).toBe(400);
  });
  it("supports rejection reasons, resubmission, approval, and history", async () => {
    const id = await draft();
    await upload(id);
    await owner.post(`/api/v1/seller/listings/${id}/submit`).send({});
    expect(
      (
        await admin
          .post(`/api/v1/admin/listings/${id}/moderate`)
          .send({ action: "reject" })
      ).status,
    ).toBe(400);
    expect(
      (
        await admin
          .post(`/api/v1/admin/listings/${id}/moderate`)
          .send({ action: "reject", reason: "Add property details" })
      ).status,
    ).toBe(200);
    expect(
      (await owner.get(`/api/v1/seller/listings/${id}`)).body.rejectionReason,
    ).toBe("Add property details");
    await publish(id);
    expect((await request(app).get(`/api/v1/listings/${id}`)).status).toBe(200);
    const history = (await admin.get(`/api/v1/admin/listings/${id}/history`))
      .body;
    expect(history.map((h: any) => h.action)).toContain("reject");
    expect(history.map((h: any) => h.action)).toContain("approve");
  });
  it("returns published edits and photo edits to review immediately", async () => {
    const id = await draft();
    const pid = await upload(id);
    await publish(id);
    expect(
      (
        await owner
          .put(`/api/v1/seller/listings/${id}`)
          .send({ ...input, title: "Updated property title" })
      ).body.status,
    ).toBe("pending");
    expect((await request(app).get(`/api/v1/listings/${id}`)).status).toBe(404);
    await admin
      .post(`/api/v1/admin/listings/${id}/moderate`)
      .send({ action: "approve" });
    expect(
      (
        await owner
          .post(`/api/v1/seller/listings/${id}/photos`)
          .attach("photos", photo, "second.png")
      ).body.status,
    ).toBe("pending");
    expect((await request(app).get(`/api/v1/photos/${pid}`)).status).toBe(404);
  });
  it("reorders and removes photos while rejecting invalid images and foreign ids", async () => {
    const id = await draft();
    await upload(id);
    const second = await owner
      .post(`/api/v1/seller/listings/${id}/photos`)
      .attach("photos", photo, "second.png");
    const ids = second.body.photos.map((p: any) => p.id);
    expect(
      (
        await owner
          .put(`/api/v1/seller/listings/${id}/photos/order`)
          .send({ ids: [...ids].reverse() })
      ).status,
    ).toBe(200);
    expect(
      (await owner.get(`/api/v1/seller/listings/${id}`)).body.photos[0].id,
    ).toBe(ids[1]);
    expect(
      (
        await owner
          .put(`/api/v1/seller/listings/${id}/photos/order`)
          .send({ ids: ["wrong"] })
      ).status,
    ).toBe(400);
    expect(
      (
        await owner
          .post(`/api/v1/seller/listings/${id}/photos`)
          .attach("photos", Buffer.from("not an image"), "fake.png")
      ).status,
    ).toBe(400);
    expect(
      (await owner.delete(`/api/v1/seller/listings/${id}/photos/${ids[0]}`))
        .status,
    ).toBe(200);
    expect(
      (await owner.get(`/api/v1/seller/listings/${id}`)).body.photos,
    ).toHaveLength(1);
  });
  it("archives sold and rented properties and removes them from favorites and public APIs", async () => {
    for (const transaction of ["sale", "rent"]) {
      const id = await draft({ transaction });
      await upload(id);
      await publish(id);
      await owner.put(`/api/v1/favorites/${id}`);
      expect(
        (
          await owner
            .post(`/api/v1/seller/listings/${id}/archive`)
            .send({ reason: transaction === "sale" ? "sold" : "rented" })
        ).status,
      ).toBe(200);
      expect((await request(app).get(`/api/v1/listings/${id}`)).status).toBe(
        404,
      );
      expect(
        (await owner.get("/api/v1/favorites")).body.some(
          (p: any) => p.id === id,
        ),
      ).toBe(false);
      expect(
        (await owner.put(`/api/v1/seller/listings/${id}`).send(input)).status,
      ).toBe(409);
    }
  });
});
describe("search, locations and persistence", () => {
  it("combines filters, searches Burmese, requires currency for price, normalizes acres, and paginates", async () => {
    const id = await draft({
      title: "မြေကွက် Test land",
      category: "land",
      bedrooms: null,
      bathrooms: null,
      area: 1,
      areaUnit: "acre",
      currency: "USD",
      price: 25000,
    });
    await upload(id);
    await publish(id);
    const result = await request(app).get("/api/v1/listings").query({
      q: "မြေကွက်",
      category: "land",
      cityId: "yangon",
      townshipId: "bahan",
      transaction: "sale",
      currency: "USD",
      minPrice: 20000,
      maxPrice: 30000,
      minArea: 43000,
      maxArea: 44000,
      sort: "price-asc",
    });
    expect(result.status).toBe(200);
    expect(result.body.items.map((p: any) => p.id)).toEqual([id]);
    expect(
      (await request(app).get("/api/v1/listings?minPrice=100")).status,
    ).toBe(400);
    expect(
      (await request(app).get("/api/v1/listings?sort=price-desc")).status,
    ).toBe(400);
    expect(
      (
        await request(app).get(
          "/api/v1/listings?currency=MMK&minPrice=200&maxPrice=100",
        )
      ).status,
    ).toBe(400);
    for (let i = 0; i < 14; i++) {
      const lid = await draft({ title: `Pagination test property ${i}` });
      db.update(s.listings)
        .set({ status: "published" })
        .where(eq(s.listings.id, lid))
        .run();
    }
    const first = (await request(app).get("/api/v1/listings?q=Pagination"))
      .body;
    const second = (
      await request(app).get("/api/v1/listings?q=Pagination&page=2")
    ).body;
    expect(first.items).toHaveLength(12);
    expect(second.items).toHaveLength(2);
    expect(first.total).toBe(14);
    expect(
      new Set([...first.items, ...second.items].map((p) => p.id)).size,
    ).toBe(14);
  });
  it("manages locations and deactivates referenced records instead of breaking listings", async () => {
    const city = await admin
      .post("/api/v1/admin/cities")
      .send({ nameEn: "Test City", nameMy: "စမ်းသပ်မြို့" });
    expect(city.status).toBe(201);
    const township = await admin.post("/api/v1/admin/townships").send({
      cityId: city.body.id,
      nameEn: "Test Township",
      nameMy: "စမ်းသပ်မြို့နယ်",
    });
    expect(township.status).toBe(201);
    await draft({ cityId: city.body.id, townshipId: township.body.id });
    expect(
      (await admin.delete(`/api/v1/admin/townships/${township.body.id}`)).body
        .deactivated,
    ).toBe(true);
    expect(
      (await request(app).get("/api/v1/locations")).body.townships.some(
        (t: any) => t.id === township.body.id,
      ),
    ).toBe(false);
    expect(
      (await request(app).get("/api/v1/locations?includeInactive=true")).status,
    ).toBe(401);
    expect(
      (
        await admin
          .put(`/api/v1/admin/townships/${township.body.id}`)
          .send({ nameEn: "Renamed", nameMy: "အမည်အသစ်", cityId: "yangon" })
      ).status,
    ).toBe(400);
    expect(
      (
        await owner.post("/api/v1/seller/listings").send({
          ...input,
          cityId: city.body.id,
          townshipId: township.body.id,
        })
      ).status,
    ).toBe(400);
  });
  it("retains database records, sessions, photos, and favorites when a new server starts", async () => {
    persistedId = await draft();
    const pid = await upload(persistedId);
    await publish(persistedId);
    await owner.put(`/api/v1/favorites/${persistedId}`);
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "server/index.ts"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PORT: "3099",
          HOST: "127.0.0.1",
          API_URL: "http://localhost:3099",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Restarted server did not start")),
          10000,
        );
        child.stdout.on("data", (chunk) => {
          if (String(chunk).includes("listening")) {
            clearTimeout(timer);
            resolve();
          }
        });
        child.on("exit", (code) => {
          clearTimeout(timer);
          reject(new Error(`Server exited ${code}`));
        });
      });
      expect(
        (await fetch(`http://127.0.0.1:3099/api/v1/listings/${persistedId}`))
          .status,
      ).toBe(200);
      expect(
        (await fetch(`http://127.0.0.1:3099/api/v1/photos/${pid}`)).status,
      ).toBe(200);
      const favorites = await fetch("http://127.0.0.1:3099/api/v1/favorites", {
        headers: { cookie: ownerCookie },
      });
      expect(favorites.status).toBe(200);
      expect(
        (await favorites.json()).some((p: any) => p.id === persistedId),
      ).toBe(true);
      const reopened = new Database(path.join(dir, "portal.sqlite"));
      expect(
        reopened
          .prepare("SELECT owner_id FROM listings WHERE id = ?")
          .get(persistedId),
      ).toEqual({ owner_id: ownerId });
      reopened.close();
    } finally {
      child.kill("SIGTERM");
      await new Promise((resolve) => child.once("exit", resolve));
    }
  });
});
