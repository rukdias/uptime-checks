import { test, expect } from "./fixtures";

test.use({ baseURL: "https://context-bulbs.fly.dev" });

test("signed-out landing renders", async ({ page, guard }) => {
  await guard.visit("/");
  await expect(page).toHaveTitle(/contextbulbs/);
  await expect(page.getByText(/start your first lightbulb/i).first()).toBeVisible();
  await expect(page.getByText(/sign in/i).first()).toBeVisible();
});

test("docs render", async ({ page, guard }) => {
  await guard.visit("/docs");
  await expect(page).toHaveTitle(/Docs/);
  await expect(page.getByRole("heading", { name: /API documentation/i }).first()).toBeVisible();
  await expect(page.getByText("/api/public/shared/{token}/index").first()).toBeVisible();
});

test("privacy renders", async ({ page, guard }) => {
  await guard.visit("/privacy");
  await expect(page).toHaveTitle(/Privacy/);
  await expect(page.getByText(/privacy policy/i).first()).toBeVisible();
  await expect(page.getByText(/what we collect/i).first()).toBeVisible();
});

test("trust renders", async ({ page, guard }) => {
  await guard.visit("/trust");
  await expect(page).toHaveTitle(/What we store/);
  await expect(page.getByText(/your AI keys are yours/i).first()).toBeVisible();
});

test("unknown path shows the 404 page", async ({ page, guard }) => {
  await guard.visit("/smoke-test-no-such-page");
  await expect(page).toHaveTitle(/Page not found/);
  await expect(page.getByText(/this page was misfiled/i)).toBeVisible();
});

test("unknown share token shows not-found", async ({ page, guard }) => {
  guard.allow(/^\/api\/public\/shared\/not-a-real-token/);
  await guard.visit("/shared/not-a-real-token");
  await expect(page.getByText(/this link is not here/i)).toBeVisible();
  await expect(page.getByText(/doesn.t exist or its owner has revoked the link/i)).toBeVisible();
});
