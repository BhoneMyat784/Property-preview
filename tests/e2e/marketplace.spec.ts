import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("portal-language"))
      localStorage.setItem("portal-language", "en");
  });
});
async function login(page: Page, email = "owner@demo.local") {
  await page.goto("/auth");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("DemoPortal123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
test("renders public content in HTML and hydrates search, filters and pagination", async ({
  page,
  request,
}) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain("A little room to grow");
  const detail = await request.get("/properties/demo-01");
  expect(detail.status()).toBe(200);
  expect(await detail.text()).toContain("A little room to grow");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good places. New beginnings." }),
  ).toBeVisible();
  await page.getByLabel("City", { exact: true }).selectOption("yangon");
  await page.getByLabel("Property type", { exact: true }).selectOption("house");
  await page
    .getByRole("button", { name: "Find properties", exact: true })
    .click();
  await expect(page).toHaveURL(/cityId=yangon/);
  await expect(page).toHaveURL(/category=house/);
  await expect(
    page.getByRole("heading", { name: "For sale", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Currency", { exact: true }).selectOption("USD");
  await page.getByLabel("Minimum price", { exact: true }).fill("100000");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/currency=USD/);
  await expect(
    page.getByText("A little room to grow", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Currency", { exact: true })).toHaveValue("USD");
  await expect(page.getByLabel("Minimum price", { exact: true })).toHaveValue(
    "100000",
  );
  await page.goto("/properties");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page.getByRole("button", { name: "Previous", exact: true }),
  ).toBeEnabled();
  expect(errors).toEqual([]);
});
test("persists the Burmese/English switch and fits the viewport", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "မြန်မာဘာသာသို့ပြောင်းရန်" }).click();
  await expect(
    page.getByRole("heading", { name: "နေရာကောင်းများ။ အစသစ်များ။" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Switch to English" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(
    page.getByRole("heading", { name: "Good places. New beginnings." }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe(
    "BODY",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.local/${test.info().project.name}-homepage.png`,
    fullPage: true,
  });
});
test("signs in, saves a property, and removes it from the shortlist", async ({
  page,
}) => {
  await login(page);
  await page.goto("/properties/demo-01");
  const save = page.getByRole("button", { name: "Save property", exact: true });
  const saved = page.getByRole("button", { name: "Saved", exact: true });
  if (await saved.count()) await saved.click();
  await expect(save).toBeVisible();
  await save.click();
  await expect(saved).toBeVisible();
  await page.goto("/favorites");
  await expect(
    page.getByText("A little room to grow", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Saved", exact: true }).click();
  await expect(
    page.getByText("A little room to grow", { exact: true }),
  ).toHaveCount(0);
});
test("creates, uploads, submits, approves, edits, rejects, resubmits and withdraws a listing", async ({
  page,
  browser,
  request,
}) => {
  await login(page);
  const title = `E2E garden home ${Date.now()}`;
  await page.goto("/dashboard/listings/new");
  await page.getByLabel("Listing title").fill(title);
  await page
    .getByLabel("About this property")
    .fill(
      "A bright family house with a spacious garden and convenient local amenities.",
    );
  await page.getByLabel("City", { exact: true }).selectOption("yangon");
  await page.getByLabel("Township", { exact: true }).selectOption("bahan");
  await page
    .getByLabel("Address", { exact: true })
    .fill("123 Test Street, Bahan");
  await page.getByLabel("Price", { exact: true }).fill("250000000");
  await page.getByLabel("Area", { exact: true }).fill("1500");
  await page.getByLabel("Bedrooms", { exact: true }).fill("3");
  await page.getByLabel("Bathrooms", { exact: true }).fill("2");
  await page.getByLabel("Contact phone number").fill("+959123456789");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page).toHaveURL(/\/dashboard\/listings\/[a-f0-9-]+$/);
  const id = page.url().split("/").pop()!;
  const png = await sharp({
    create: { width: 300, height: 200, channels: 3, background: "#99aa77" },
  })
    .png()
    .toBuffer();
  await page
    .getByLabel("Upload photos")
    .setInputFiles({ name: "house.png", mimeType: "image/png", buffer: png });
  await expect(
    page.getByRole("button", { name: "Remove", exact: true }),
  ).toBeVisible();
  const uploaded = await (
    await page.request.get(`/api/v1/seller/listings/${id}`)
  ).json();
  expect((await page.request.get(uploaded.photos[0].url)).status()).toBe(200);
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect((await request.get(`/api/v1/listings/${id}`)).status()).toBe(404);
  const context = await browser.newContext();
  await context.addInitScript(() =>
    localStorage.setItem("portal-language", "en"),
  );
  const admin = await context.newPage();
  await login(admin, "admin@demo.local");
  await admin.goto("/admin");
  let card = admin
    .getByRole("heading", { name: title, exact: true })
    .locator("xpath=../../..");
  await card.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(
    admin.getByRole("heading", { name: title, exact: true }),
  ).toHaveCount(0);
  expect((await request.get(`/api/v1/listings/${id}`)).status()).toBe(200);
  expect(await (await request.get(`/properties/${id}`)).text()).toContain(
    title,
  );
  await page.goto(`/dashboard/listings/${id}`);
  const edited = `${title} updated`;
  await page.getByLabel("Listing title").fill(edited);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  expect((await request.get(`/api/v1/listings/${id}`)).status()).toBe(404);
  const unavailable = await request.get(`/properties/${id}`);
  expect(unavailable.status()).toBe(404);
  expect(await unavailable.text()).not.toContain(edited);
  await admin.reload();
  card = admin
    .getByRole("heading", { name: edited, exact: true })
    .locator("xpath=../../..");
  await card
    .getByLabel("Reason")
    .fill("Please clarify the property description");
  await card.getByRole("button", { name: "Reject", exact: true }).click();
  await page.reload();
  await expect(
    page.getByText("Please clarify the property description", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await admin.reload();
  card = admin
    .getByRole("heading", { name: edited, exact: true })
    .locator("xpath=../../..");
  await card.getByRole("button", { name: "Approve", exact: true }).click();
  await page.reload();
  const sellerCard = page
    .getByRole("heading", { name: edited, exact: true })
    .locator("xpath=../../..");
  await sellerCard.getByRole("button", { name: "Mark as sold" }).click();
  expect((await request.get(`/api/v1/listings/${id}`)).status()).toBe(404);
  expect(await (await request.get(`/properties/${id}`)).text()).not.toContain(
    edited,
  );
  await context.close();
});
test("verifies email, resets password, and logs out through the browser", async ({
  page,
  request,
}) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto("/auth");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Full name").fill("Browser Test");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Original123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByText(
      "Check your email to verify your account before signing in.",
    ),
  ).toBeVisible();
  const inbox = await (await request.get("/api/v1/dev/inbox")).json();
  const verification = inbox.find(
    (m: any) => m.to === email && m.subject === "Verify your email",
  );
  await page.goto(verification.url);
  await page.goto("/auth");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Original123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/auth");
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByText("If this account exists, a reset link has been sent."),
  ).toBeVisible();
  const messages = await (await request.get("/api/v1/dev/inbox")).json();
  const reset = messages.find(
    (m: any) => m.to === email && m.subject === "Reset your password",
  );
  await page.goto(reset.url);
  await page.getByLabel("New password").fill("Changed123!");
  await page
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await expect(
    page.getByText("Password updated. Sign in with your new password."),
  ).toBeVisible();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Changed123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  if (test.info().project.name === "mobile")
    await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByText("Sign in to continue", { exact: true }),
  ).toBeVisible();
});
