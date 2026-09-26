import { test, expect } from "./fixtures";

test.use({ baseURL: "https://knight-teleprompter.fly.dev" });

test("landing renders", async ({ page, guard }) => {
  await guard.visit("/");
  await expect(page).toHaveTitle(/Knight Teleprompter/);
  await expect(page.getByText(/open the editor/i).first()).toBeVisible();
});

test("editor launches and closes the prompter", async ({ page, guard }) => {
  await guard.visit("/app");
  const launch = page.getByRole("button", { name: "Launch the prompter" });
  await expect(launch).toBeVisible();
  await expect(launch).toBeDisabled();

  // The script lives only in this browser's local storage; nothing is sent.
  const script = page.getByRole("textbox", { name: "Script" });
  await script.fill("Smoke test line one.\nSmoke test line two.");
  await expect(launch).toBeEnabled();

  await launch.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Smoke test line one.");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(launch).toBeVisible();
});

test("privacy renders", async ({ page, guard }) => {
  await guard.visit("/privacy");
  await expect(page).toHaveTitle(/Privacy Policy/);
  await expect(page.getByText(/what we collect/i).first()).toBeVisible();
});

test("terms render", async ({ page, guard }) => {
  await guard.visit("/terms");
  await expect(page).toHaveTitle(/Terms of Service/);
  await expect(page.getByText(/the service/i).first()).toBeVisible();
});
