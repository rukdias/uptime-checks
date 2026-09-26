import { test, expect, isPhone } from "./fixtures";

test.use({ baseURL: "https://boozeboard.fly.dev" });

const ALL_TABS = ["Specials", "Menu", "Events", "Requests", "Screens", "Analytics", "Settings"];
const OVERFLOW_TABS = ["Events", "Analytics", "Settings"];

test("landing renders", async ({ page, guard }) => {
  await guard.visit("/");
  await expect(page).toHaveTitle(/BoozeBoard/);
  await expect(page.getByText(/set it up/i).first()).toBeVisible();
});

test("TV display shows the bar name", async ({ page, guard }) => {
  await guard.visit("/display/the-rusty-tap");
  await expect(page).toHaveTitle(/The Rusty Tap/);
  await expect(page.getByText("The Rusty Tap", { exact: true }).first()).toBeVisible();
});

test("phone menu lists menu items", async ({ page, guard }) => {
  await guard.visit("/menu/the-rusty-tap");
  await expect(page.getByText("The Rusty Tap", { exact: true }).first()).toBeVisible();
  for (const item of ["West Coast IPA, hoppy and crisp", "Classic lime margarita", "Loaded Nachos"]) {
    await expect(page.getByText(item).first()).toBeVisible();
  }
});

test("demo admin tabs each show their panel", async ({ page, guard }) => {
  await guard.visit("/admin/the-rusty-tap");
  await expect(page.getByText(/demo edition/i)).toBeVisible();
  // Desktop shows all 7 tabs; phone shows 4 and tucks the rest behind "More".
  const visibleTabs = isPhone() ? ALL_TABS.filter((t) => !OVERFLOW_TABS.includes(t)) : ALL_TABS;
  await expect(page.getByRole("tab")).toHaveCount(visibleTabs.length);
  const more = page.getByRole("button", { name: "More sections" });
  if (isPhone()) {
    for (const t of OVERFLOW_TABS) await expect(page.getByRole("tab", { name: t, exact: true })).toBeHidden();
    await expect(more).toBeVisible();
  } else {
    await expect(more).toBeHidden();
  }

  for (const name of visibleTabs) {
    const tab = page.getByRole("tab", { name, exact: true });
    await expect(tab).toBeVisible();
    await guard.activate(tab, `${name} tab`);
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toBeVisible();
    await guard.checkOverflow();
  }

  if (isPhone()) {
    for (const name of OVERFLOW_TABS) {
      await guard.activate(more, "More sections button");
      const item = page.getByRole("menuitem", { name, exact: true });
      await expect(page.getByRole("menu")).toBeVisible();
      await expect(item).toBeVisible();
      await guard.activate(item, `${name} menu item`);
      await expect(page.getByRole("menu")).toBeHidden();
      // The tab itself stays display:none on phone; check its selected state by id.
      await expect(page.locator(`#tab-${name.toLowerCase()}`)).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel")).toBeVisible();
      await guard.checkOverflow();
    }
  }
});

test("unknown bar shows not-found", async ({ page, guard }) => {
  guard.allow(/^\/api\/(bars|screens)\/does-not-exist(\/|$)/);
  await guard.visit("/display/does-not-exist");
  await expect(page.getByText(/We couldn.t find that bar\./)).toBeVisible();
});

test("setup redirects to admin", async ({ page, guard }) => {
  await guard.visit("/setup/the-rusty-tap");
  await expect(page).toHaveURL(/\/admin\/the-rusty-tap$/);
  await expect(page.getByText(/demo edition/i)).toBeVisible();
});
