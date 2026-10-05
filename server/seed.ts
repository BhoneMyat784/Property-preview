import { eq } from "drizzle-orm";
import { auth } from "./auth.js";
import { db, runMigrations, sqlite } from "./db.js";
import * as s from "./schema.js";
import { production } from "./config.js";
if (production) throw new Error("Demo seed is disabled in production");
runMigrations();
const password = process.env.DEMO_PASSWORD || "DemoPortal123!";
async function createUser(
  email: string,
  name: string,
  role = "user",
  sellerType = "owner",
) {
  let u = db.select().from(s.user).where(eq(s.user.email, email)).get();
  if (!u) {
    await auth.api.signUpEmail({ body: { email, name, password } });
    u = db.select().from(s.user).where(eq(s.user.email, email)).get()!;
  }
  db.update(s.user)
    .set({ emailVerified: true, role })
    .where(eq(s.user.id, u.id))
    .run();
  db.insert(s.profiles)
    .values({ userId: u.id, sellerType })
    .onConflictDoNothing()
    .run();
  return u.id;
}
await createUser("admin@demo.local", "Portal Admin", "admin");
const owner = await createUser("owner@demo.local", "Thiri — Demo Owner");
const agent = await createUser(
  "agent@demo.local",
  "Golden Home — Demo Agent",
  "user",
  "agent",
);
const locations = [
  [
    "yangon",
    "Yangon",
    "ရန်ကုန်",
    [
      ["bahan", "Bahan", "ဗဟန်း"],
      ["sanchaung", "Sanchaung", "စမ်းချောင်း"],
      ["kamayut", "Kamayut", "ကမာရွတ်"],
      ["hlaing", "Hlaing", "လှိုင်"],
      ["south-okkalapa", "South Okkalapa", "တောင်ဥက္ကလာပ"],
      ["dagon", "Dagon", "ဒဂုံ"],
    ],
  ],
  [
    "mandalay",
    "Mandalay",
    "မန္တလေး",
    [
      ["chanayethazan", "Chanayethazan", "ချမ်းအေးသာစံ"],
      ["chanmyathazi", "Chanmyathazi", "ချမ်းမြသာစည်"],
      ["maha-aungmye", "Maha Aungmye", "မဟာအောင်မြေ"],
      ["aungmyethazan", "Aungmyethazan", "အောင်မြေသာစံ"],
      ["pyigyidagun", "Pyigyidagun", "ပြည်ကြီးတံခွန်"],
      ["amarapura", "Amarapura", "အမရပူရ"],
    ],
  ],
] as const;
for (const [id, nameEn, nameMy, towns] of locations) {
  db.insert(s.cities)
    .values({ id, nameEn, nameMy })
    .onConflictDoNothing()
    .run();
  for (const [tid, en, my] of towns)
    db.insert(s.townships)
      .values({ id: tid, cityId: id, nameEn: en, nameMy: my })
      .onConflictDoNothing()
      .run();
}
const images = {
  house: [
    "photo-1600585154340-be6161a56a0c",
    "photo-1600047509807-ba8f99d2cdde",
  ],
  apartment: [
    "photo-1600607687920-4e2a09cf159d",
    "photo-1600210492486-724fe5c67fb0",
  ],
  land: [
    "photo-1500382017468-9049fed747ef",
    "photo-1473448912268-2022ce9509d8",
  ],
};
const names = {
  house: [
    "A little room to grow",
    "A home for your next chapter",
    "Garden living, city convenience",
  ],
  apartment: [
    "Light-filled city apartment",
    "Your everyday sanctuary",
    "Modern living with a view",
  ],
  land: [
    "Space for your biggest plans",
    "A fresh start on open land",
    "Build your future here",
  ],
};
for (let i = 0; i < 24; i++) {
  const city = i % 2 === 0 ? "yangon" : "mandalay";
  const category = (["house", "apartment", "land"] as const)[i % 3];
  const transaction = i % 4 < 2 ? "sale" : "rent";
  const currency = i % 5 === 0 ? "USD" : "MMK";
  const id = `demo-${String(i + 1).padStart(2, "0")}`;
  if (db.select().from(s.listings).where(eq(s.listings.id, id)).get()) continue;
  const cityInfo = locations.find((l) => l[0] === city)!;
  const township = cityInfo[3][Math.floor(i / 2) % 6][0];
  db.insert(s.listings)
    .values({
      id,
      ownerId: i % 2 === 0 ? agent : owner,
      title: names[category][Math.floor(i / 3) % 3],
      description:
        "DEMO LISTING — This property is sample data for exploring Property Portal and is not available for sale or rent. Discover a thoughtfully presented space with convenient access to local amenities. Replace this sample with your own property description.\n\nနမူနာကြော်ငြာဖြစ်ပြီး အမှန်တကယ်ရောင်းချခြင်း သို့မဟုတ် ငှားရမ်းခြင်း မရှိပါ။",
      transaction,
      category,
      cityId: city,
      townshipId: township,
      address: `Demo address, ${cityInfo[3][Math.floor(i / 2) % 6][1]}`,
      currency,
      price:
        currency === "USD"
          ? transaction === "sale"
            ? 125000 + i * 10000
            : 450 + i * 25
          : transaction === "sale"
            ? 180000000 + i * 15000000
            : 650000 + i * 50000,
      area: category === "land" ? 0.5 + i * 0.1 : 850 + i * 85,
      areaUnit: category === "land" ? "acre" : "sqft",
      bedrooms: category === "land" ? null : 2 + (i % 3),
      bathrooms: category === "land" ? null : 1 + (i % 2),
      phone: "+959000000000",
      viber: "+959000000000",
      status: i === 22 ? "draft" : i === 23 ? "pending" : "published",
      demo: true,
      createdAt: Date.now() - i * 3600000,
      updatedAt: Date.now() - i * 3600000,
    })
    .run();
  images[category].forEach((image, j) =>
    db
      .insert(s.photos)
      .values({
        id: `${id}-photo-${j}`,
        listingId: id,
        externalUrl: `https://images.unsplash.com/${image}?auto=format&fit=crop&w=1200&q=85`,
        position: j,
      })
      .run(),
  );
}
sqlite.close();
console.log(
  "Demo data ready. Accounts: admin@demo.local, owner@demo.local, agent@demo.local. See README for the development password.",
);
