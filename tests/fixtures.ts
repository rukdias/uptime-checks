import { test as base, expect, type Locator, type Page } from "@playwright/test";

/**
 * Shared guard for every smoke test.
 *
 * - Collects console errors, uncaught page errors, and same-origin responses
 *   >= 400 (and same-origin requests that fail outright), and fails the test
 *   at teardown if any are unexpected. A 401 is always allowed: every app
 *   probes its session endpoint while signed out. Tests that deliberately
 *   visit a missing resource pass `allow` patterns for the 404s they expect.
 * - Read-only safety net: any non-GET/HEAD/OPTIONS request is answered
 *   locally with 204 and never reaches production (e.g. BoozeBoard's
 *   visitor-analytics beacon), so a smoke run cannot create data even if a
 *   page fires a write on load.
 * - On the phone project, checks there is no horizontal page overflow on
 *   every page visited (before navigating away, and at teardown).
 */
type Guard = {
  /** Navigate to a path on the app under test and wait for it to settle. */
  visit: (path: string) => Promise<void>;
  /** Allow same-origin error responses whose path matches (e.g. expected 404s). */
  allow: (...patterns: RegExp[]) => void;
  /** Check horizontal overflow now (phone project only). */
  checkOverflow: () => Promise<void>;
  /** Click if a user could reach it; else soft-fail and use the keyboard. */
  activate: (target: Locator, what: string) => Promise<void>;
  /** Writes that the safety net blocked (method + path). */
  blockedWrites: string[];
};

const IGNORED_CONSOLE = [
  // Resource failures are judged by the network listener below, which knows
  // the URL and the origin; the console copy carries neither.
  /^Failed to load resource/,
];

export const test = base.extend<{ guard: Guard }>({
  guard: [
    async ({ page, baseURL }, use, testInfo) => {
      const origin = new URL(baseURL!).origin;
      const phone = testInfo.project.name === "phone";
      const problems: string[] = [];
      const allowed: RegExp[] = [];
      const blockedWrites: string[] = [];
      const overflowReported = new Set<string>();
      const unreachable: string[] = [];

      await page.route("**/*", (route) => {
        const req = route.request();
        if (["GET", "HEAD", "OPTIONS"].includes(req.method())) return route.fallback();
        const u = new URL(req.url());
        blockedWrites.push(`${req.method()} ${u.origin === origin ? u.pathname : u.href}`);
        return route.fulfill({ status: 204, body: "" });
      });

      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        const text = msg.text();
        if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
        problems.push(`console error on ${page.url()}: ${text.slice(0, 300)}`);
      });
      page.on("pageerror", (err) => problems.push(`uncaught error on ${page.url()}: ${err.message.slice(0, 300)}`));
      page.on("response", (res) => {
        const u = new URL(res.url());
        if (u.origin !== origin || res.status() < 400 || res.status() === 401) return;
        if (allowed.some((re) => re.test(u.pathname + u.search))) return;
        problems.push(`HTTP ${res.status()} ${res.request().method()} ${u.pathname}${u.search}`);
      });
      page.on("requestfailed", (req) => {
        const u = new URL(req.url());
        const err = req.failure()?.errorText ?? "";
        // ERR_ABORTED: navigation or unmount cancelled an in-flight request.
        if (u.origin !== origin || err.includes("ERR_ABORTED")) return;
        if (allowed.some((re) => re.test(u.pathname + u.search))) return;
        problems.push(`request failed ${req.method()} ${u.pathname}: ${err}`);
      });

      // Compare against the configured viewport width, not window.innerWidth:
      // with isMobile, Chromium widens the layout viewport to fit overflowing
      // content (innerWidth grows too), which would hide the very bug we want.
      const checkOverflow = async () => {
        if (!phone || page.isClosed() || !page.url().startsWith(origin)) return;
        const width = page.viewportSize()!.width;
        const { scrollWidth, offenders } = await page.evaluate((w) => {
          const offenders = [...document.querySelectorAll("body *")]
            .filter((el) => el.getBoundingClientRect().right > w + 1)
            .filter((el) => !el.parentElement || el.parentElement.getBoundingClientRect().right <= w + 1)
            .slice(0, 3)
            .map((el) => {
              const label = (el.getAttribute("aria-label") || (el as HTMLElement).innerText || "").trim().slice(0, 40);
              return `<${el.tagName.toLowerCase()}> "${label}" right edge ${Math.round(el.getBoundingClientRect().right)}px`;
            });
          return { scrollWidth: document.documentElement.scrollWidth, offenders };
        }, width);
        const path = new URL(page.url()).pathname;
        if (scrollWidth > width && overflowReported.has(path)) return;
        if (scrollWidth > width) overflowReported.add(path);
        expect
          .soft(scrollWidth, `horizontal overflow at ${width}px on ${path}; widest: ${offenders.join("; ") || "n/a"}`)
          .toBeLessThanOrEqual(width);
      };

      /**
       * Tap/click like a user when the element is actually reachable on screen;
       * otherwise record a soft failure (so a layout bug is reported, not
       * hidden) and activate it from the keyboard so the rest of the flow is
       * still exercised.
       */
      const activate = async (target: Locator, what: string) => {
        await expect(target).toBeAttached();
        const reachable = await target.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const vv = window.visualViewport!;
          const x = r.left + r.width / 2, y = r.top + r.height / 2;
          if (x < 0 || y < 0 || x > vv.width || y > vv.height) return false;
          const hit = document.elementFromPoint(x, y);
          return !!hit && el.contains(hit);
        });
        if (reachable) return target.click();
        unreachable.push(`${what} on ${new URL(page.url()).pathname}`);
        await target.focus();
        await page.keyboard.press("Enter");
      };

      const visit = async (path: string) => {
        if (page.url().startsWith(origin)) await checkOverflow();
        const res = await page.goto(path, { waitUntil: "load" });
        expect(res, `no response for ${path}`).not.toBeNull();
        expect(res!.status(), `document status for ${path}`).toBeLessThan(400);
        await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
      };

      await use({ visit, allow: (...p) => allowed.push(...p), checkOverflow, activate, blockedWrites });

      await checkOverflow();
      expect.soft(unreachable, "controls a user cannot tap (off-screen or covered)").toEqual([]);
      if (blockedWrites.length) {
        testInfo.annotations.push({ type: "blocked writes", description: blockedWrites.join(", ") });
      }
      expect(problems, "console errors / failed same-origin requests").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect, type Page };

/** True on the phone project. */
export const isPhone = () => test.info().project.name === "phone";
