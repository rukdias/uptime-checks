import { test, expect } from "./fixtures";

test.use({ baseURL: "https://checkmate-labs.fly.dev" });

test("landing renders", async ({ page, guard }) => {
  await guard.visit("/");
  await expect(page).toHaveTitle(/Checkmate Labs/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/We build software/i);
  await expect(page.getByRole("link", { name: /see the products/i }).first()).toBeVisible();
});

test("studio page renders", async ({ page, guard }) => {
  await guard.visit("/studio");
  await expect(page).toHaveTitle(/Checkmate Labs/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("a product page renders", async ({ page, guard }) => {
  await guard.visit("/products/mmt-hq");
  await expect(page).toHaveTitle(/MMT HQ/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
