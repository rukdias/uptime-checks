import { test, expect } from "./fixtures";

test.use({ baseURL: "https://rukdias.fly.dev" });

test("home renders with projects from the database", async ({ page, guard }) => {
  await guard.visit("/");
  await expect(page).toHaveTitle(/Ruk Dias/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Project cards come from /api/projects (Postgres, cached after boot).
  await expect(page.getByText("RuneCrypt").first()).toBeVisible();
});

test("a project page renders its image", async ({ page, guard }) => {
  await guard.visit("/project/runecrypt");
  await expect(page).toHaveTitle(/RuneCrypt/);
  const img = page.locator('img[src*="/attached_assets/"]').first();
  await expect(img).toBeVisible();
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
});
