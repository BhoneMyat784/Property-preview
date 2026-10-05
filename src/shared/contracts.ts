import { z } from "zod";

export const categories = ["land", "apartment", "house"] as const;
export const statuses = [
  "draft",
  "pending",
  "published",
  "rejected",
  "archived",
] as const;
export const currencies = ["MMK", "USD"] as const;
const optionalCount = z.number().int().min(0).max(100).nullable();
export const listingInput = z
  .object({
    title: z.string().trim().min(5).max(160),
    description: z.string().trim().min(20).max(10000),
    transaction: z.enum(["sale", "rent"]),
    category: z.enum(categories),
    cityId: z.string().min(1),
    townshipId: z.string().min(1),
    address: z.string().trim().min(3).max(500),
    currency: z.enum(currencies),
    price: z
      .number()
      .positive()
      .max(1e14)
      .refine(
        (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001,
        "Use at most two decimal places",
      ),
    area: z.number().positive().max(1e9),
    areaUnit: z.enum(["sqft", "acre"]),
    bedrooms: optionalCount,
    bathrooms: optionalCount,
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d ()-]{7,25}$/, "Enter a valid phone number"),
    viber: z
      .string()
      .trim()
      .regex(/^(\+?[\d ()-]{7,25})?$/, "Enter a Viber phone number")
      .default(""),
  })
  .superRefine((v, ctx) => {
    if (v.category !== "land" && v.areaUnit !== "sqft")
      ctx.addIssue({
        code: "custom",
        path: ["areaUnit"],
        message: "Use square feet for houses and apartments",
      });
    if (v.category === "land" && (v.bedrooms !== null || v.bathrooms !== null))
      ctx.addIssue({
        code: "custom",
        path: ["bedrooms"],
        message: "Land cannot have bedrooms or bathrooms",
      });
  });
export type ListingInput = z.infer<typeof listingInput>;
const queryNumber = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : Number(v)),
  z.number().nonnegative().optional(),
);
export const searchInput = z
  .object({
    q: z.string().trim().max(100).optional(),
    transaction: z.enum(["sale", "rent"]).optional(),
    category: z.enum(categories).optional(),
    cityId: z.string().optional(),
    townshipId: z.string().optional(),
    currency: z.enum(currencies).optional(),
    minPrice: queryNumber,
    maxPrice: queryNumber,
    minArea: queryNumber,
    maxArea: queryNumber,
    bedrooms: queryNumber,
    sort: z.enum(["newest", "price-asc", "price-desc"]).default("newest"),
    page: z.coerce.number().int().min(1).max(100000).default(1),
  })
  .superRefine((v, ctx) => {
    if (
      (v.minPrice !== undefined ||
        v.maxPrice !== undefined ||
        v.sort !== "newest") &&
      !v.currency
    )
      ctx.addIssue({
        code: "custom",
        path: ["currency"],
        message: "Choose a currency for price filtering or sorting",
      });
    if (
      v.minPrice !== undefined &&
      v.maxPrice !== undefined &&
      v.minPrice > v.maxPrice
    )
      ctx.addIssue({
        code: "custom",
        path: ["maxPrice"],
        message: "Maximum price must be at least minimum price",
      });
    if (
      v.minArea !== undefined &&
      v.maxArea !== undefined &&
      v.minArea > v.maxArea
    )
      ctx.addIssue({
        code: "custom",
        path: ["maxArea"],
        message: "Maximum area must be at least minimum area",
      });
  });
export type SearchInput = z.infer<typeof searchInput>;
export interface Location {
  id: string;
  nameEn: string;
  nameMy: string;
  active: boolean;
  cityId?: string;
}
export interface Locations {
  cities: Location[];
  townships: Location[];
}
export interface Photo {
  id: string;
  url: string;
  position: number;
}
export interface Listing extends ListingInput {
  id: string;
  ownerId: string;
  ownerName: string;
  sellerType: "owner" | "agent";
  status: (typeof statuses)[number];
  cityNameEn: string;
  cityNameMy: string;
  townshipNameEn: string;
  townshipNameMy: string;
  photos: Photo[];
  rejectionReason: string | null;
  archiveReason: string | null;
  demo: boolean;
  createdAt: number;
  updatedAt: number;
}
export interface ListingPage {
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
}
export interface Me {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  sellerType: "owner" | "agent";
  emailVerified: boolean;
}
export const locationInput = z.object({
  nameEn: z.string().trim().min(2).max(100),
  nameMy: z.string().trim().min(2).max(100),
  cityId: z.string().optional(),
  active: z.boolean().default(true),
});
