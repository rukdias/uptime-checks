import { test, expect } from "./fixtures";

test.use({ baseURL: "https://tvesta.fly.dev" });

test("board and control bar render", async ({ page, guard }) => {
  await guard.visit("/");
  await expect(page).toHaveTitle(/TVesta/);
  const board = page.locator('[role="img"][aria-label]').first();
  await expect(board).toBeVisible();
  await expect(board).toHaveAttribute("aria-label", /\S/);

  // Controls are icon-only buttons labelled via title (no clicks: Post and
  // Settings lead to writes, Fullscreen/Mute are device-level toggles).
  for (const name of ["Post message", "Settings", "Mute", "Fullscreen"]) {
    await expect(page.getByRole("button", { name: new RegExp(`^${name}\\b`) })).toBeVisible();
  }
  await expect(page.getByText(/view-only/i)).toBeVisible();
});
