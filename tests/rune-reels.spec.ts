import { test, expect } from "./fixtures";

test.use({ baseURL: "https://rune-reels.fly.dev" });

test("home lists films with counts, first film opens", async ({ page, guard }) => {
  await guard.visit("/");
  await expect(page).toHaveTitle(/Rune Reels/);
  // Stat counters: "<n> FILMS PRESERVED" and "<n> CREATORS", both non-zero.
  for (const label of [/films preserved/i, /^creators$/i]) {
    const stat = page.getByText(label).first();
    await expect(stat).toBeVisible();
    await expect(stat.locator("xpath=..")).toContainText(/[1-9]\d*/);
  }
  const cards = page.locator("a[href^='/film/']");
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(3);

  const href = await cards.first().getAttribute("href");
  await guard.checkOverflow();
  await cards.first().click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/\S/);
  await expect(page.getByText("Film Not Found")).toHaveCount(0);
});

test("unknown film shows Film Not Found", async ({ page, guard }) => {
  guard.allow(/^\/api\/movies\/abc$/);
  await guard.visit("/film/abc");
  await expect(page.getByText("Film Not Found")).toBeVisible();
});
