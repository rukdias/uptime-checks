import { test, expect } from "./fixtures";

test.use({ baseURL: "https://sales-intelligence-hub.fly.dev" });

test("marketing page renders", async ({ page, guard }) => {
  await guard.visit("/");
  await expect(page).toHaveTitle(/Nexus/);
  await expect(page.getByText(/claim your workspace/i).first()).toBeVisible();
  await expect(page.getByText(/research agents/i).first()).toBeVisible();
});

test("login shows Sign in and Create account tabs", async ({ page, guard }) => {
  await guard.visit("/login");
  const signIn = page.getByRole("tab", { name: "Sign in" });
  const create = page.getByRole("tab", { name: "Create account" });
  await expect(signIn).toBeVisible();
  await expect(create).toBeVisible();
  await expect(signIn).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/name/i)).toHaveCount(0);

  // Switching tabs is local UI only; nothing is typed or submitted.
  await create.click();
  await expect(create).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel(/^name$/i)).toBeVisible();
});

test("login?mode=signup opens on Create account", async ({ page, guard }) => {
  await guard.visit("/login?mode=signup");
  await expect(page.getByRole("tab", { name: "Create account" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel(/^name$/i)).toBeVisible();
});
