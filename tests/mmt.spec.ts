import { test, expect, isPhone } from "./fixtures";

test.use({ baseURL: "https://mmt.football" });

test("home renders", async ({ page, guard }) => {
  await guard.visit("/");
  await expect(page).toHaveTitle(/MMT HQ/);
  await expect(page.getByText(/claim your hq/i).first()).toBeVisible();
  await expect(page.getByText(/tour the demo museum/i).first()).toBeVisible();
});

test("public demo league loads standings", async ({ page, guard }) => {
  await guard.visit("/l/demo");
  await expect(page).toHaveTitle(/The Demo League/);
  await expect(page.getByRole("heading", { name: /all-time top 3/i })).toBeVisible();

  if (isPhone()) {
    await guard.visit("/l/demo/standings");
  } else {
    await guard.checkOverflow();
    await page.getByTestId("nav-standings").click();
    await expect(page).toHaveURL(/\/l\/demo\/standings$/);
  }
  const table = page.locator("table").first();
  await expect(table).toBeVisible();
  await expect(table).toContainText(/manager/i);
  await expect(table.locator("tbody tr")).toHaveCount(10);
  await expect(table).toContainText("Riley Chen");
});

test("private league shows the sign-in page", async ({ page, guard }) => {
  // A private (or missing) league answers its data probes with 404 by design.
  guard.allow(/^\/api\/leagues\/mmt$/, /^\/api\/summary$/, /^\/api\/champions$/);
  await guard.visit("/l/mmt");
  await expect(page.getByText(/this league is private or doesn.t exist/i)).toBeVisible();
  await expect(page.getByText(/sign in/i).first()).toBeVisible();
});

test("og image is a png", async ({ request }) => {
  const res = await request.get("/api/og/demo.png");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/^image\/png/);
  const body = await res.body();
  expect(body.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
});
