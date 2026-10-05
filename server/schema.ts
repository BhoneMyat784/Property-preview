import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  role: text("role").notNull().default("user"),
});
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp_ms",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp_ms",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
export const profiles = sqliteTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  sellerType: text("seller_type").notNull().default("owner"),
});
export const cities = sqliteTable("cities", {
  id: text("id").primaryKey(),
  nameEn: text("name_en").notNull().unique(),
  nameMy: text("name_my").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});
export const townships = sqliteTable(
  "townships",
  {
    id: text("id").primaryKey(),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id),
    nameEn: text("name_en").notNull(),
    nameMy: text("name_my").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [uniqueIndex("township_city_name").on(t.cityId, t.nameEn)],
);
export const listings = sqliteTable(
  "listings",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    transaction: text("transaction").notNull(),
    category: text("category").notNull(),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id),
    townshipId: text("township_id")
      .notNull()
      .references(() => townships.id),
    address: text("address").notNull(),
    currency: text("currency").notNull(),
    price: real("price").notNull(),
    area: real("area").notNull(),
    areaUnit: text("area_unit").notNull(),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    phone: text("phone").notNull(),
    viber: text("viber").notNull().default(""),
    status: text("status").notNull().default("draft"),
    rejectionReason: text("rejection_reason"),
    archiveReason: text("archive_reason"),
    demo: integer("demo", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    index("listing_search").on(t.status, t.cityId, t.category, t.transaction),
    index("listing_price").on(t.status, t.currency, t.price),
    index("listing_owner").on(t.ownerId),
  ],
);
export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  storageKey: text("storage_key"),
  externalUrl: text("external_url"),
  position: integer("position").notNull(),
});
export const favorites = sqliteTable(
  "favorites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("favorite_user_listing").on(t.userId, t.listingId)],
);
export const moderation = sqliteTable("moderation", {
  id: text("id").primaryKey(),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id),
  actorId: text("actor_id")
    .notNull()
    .references(() => user.id),
  action: text("action").notNull(),
  reason: text("reason"),
  createdAt: integer("created_at").notNull(),
});
