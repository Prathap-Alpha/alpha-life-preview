import { test, expect } from "@playwright/test";
import fs from "node:fs";
const read = (file) =>
  fs.readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("clear insurance headline, five currencies and no copied product claims", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("h1")).toHaveText(
    "Life insurance in the currency of your choice",
  );
  await expect(page.locator(".currency-button")).toHaveCount(5);
  await expect(page.locator("body")).not.toContainText(
    /bitcoin|\bBTC\b|guaranteed yield|tax-free|licensed Bermuda/i,
  );
  await expect(page.locator("body")).toContainText(
    "Protect your family’s future in US Dollars, Euro, British Pounds, South African Rand or Botswana Pula.",
  );
  await expect(page.locator(".qualification")).toContainText(
    "subject to approval",
  );
  await expect(page.locator(".qualification")).toContainText(
    "not free insurance",
  );
  await expect(page.locator(".benefit-symbol")).toHaveCount(5);
  await expect(page.locator(".benefit-symbol").first()).toHaveJSProperty(
    "tagName",
    "svg",
  );
});

test("hero media is layered visibly beneath the shade and heading", async ({
  page,
}) => {
  await page.goto("./");
  const layers = await page.evaluate(() => {
    const z = (selector) =>
      Number(getComputedStyle(document.querySelector(selector)).zIndex);
    return [
      z(".hero-poster"),
      z(".hero-film"),
      z(".hero-shade"),
      z(".hero-content"),
    ];
  });
  expect(layers).toEqual([0, 1, 2, 3]);
  await expect(page.locator("#savanna-film source")).toHaveAttribute(
    "data-src",
    "assets/savanna-walk.mp4",
  );
  await expect
    .poll(() =>
      page.locator("#savanna-film").evaluate((video) => video.readyState),
    )
    .toBeGreaterThanOrEqual(2);
  await expect(page.locator(".hero")).toHaveClass(/is-playing/);
});

test("hero pause is persistent and explicit play resumes motion", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("[data-film-toggle]")).toHaveText("Pause film");
  await page.locator("[data-film-toggle]").click();
  await expect(page.locator("[data-film-toggle]")).toHaveText("Play film");
  expect(
    await page.locator("#savanna-film").evaluate((video) => video.paused),
  ).toBe(true);
  await page.waitForTimeout(250);
  expect(
    await page.locator("#savanna-film").evaluate((video) => video.paused),
  ).toBe(true);
  await page.locator("[data-film-toggle]").click();
  await expect(page.locator("[data-film-toggle]")).toHaveText("Pause film");
});

test("reduced motion avoids movie downloads until explicit play", async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const movies = [];
  page.on("request", (request) => {
    if (request.url().includes(".mp4")) movies.push(request.url());
  });
  await page.goto("./");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect(page.locator("#savanna-film source")).not.toHaveAttribute("src");
  await expect(page.locator("#vision-film source")).not.toHaveAttribute("src");
  expect(movies).toEqual([]);
  await page.locator("[data-film-toggle]").click();
  await expect(page.locator("#savanna-film source")).toHaveAttribute(
    "src",
    "assets/savanna-walk.mp4",
  );
  await context.close();
});

test("save-data also leaves both movies unloaded", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(Navigator.prototype, "connection", {
      configurable: true,
      get: () => ({ saveData: true }),
    }),
  );
  await page.goto("./");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect(page.locator("#savanna-film source")).not.toHaveAttribute("src");
  await expect(page.locator("#vision-film source")).not.toHaveAttribute("src");
});

test("fictional story film has explicit audio, captions and user-started playback", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator(".vision-story figcaption")).toContainText(
    "Fictional speakers, not real customer testimonials",
  );
  await expect(page.locator(".film-transcript")).toContainText("Mr Arun");
  await expect(page.locator(".film-transcript")).toContainText("Alpha Life");
  await expect(page.locator(".film-transcript")).not.toContainText("Iyer");
  await expect(page.locator("#vision-film source")).not.toHaveAttribute("src");
  await page.locator("[data-vision-play]").click();
  await expect(page.locator("#vision-film source")).toHaveAttribute(
    "src",
    "assets/vision-film-20261104.mp4",
  );
  await expect
    .poll(() =>
      page.locator("#vision-film").evaluate((video) => video.readyState),
    )
    .toBeGreaterThanOrEqual(2);
  expect(
    await page.locator("#vision-film").evaluate((video) => video.duration),
  ).toBeGreaterThanOrEqual(9);
  expect(
    await page.locator("#vision-film").evaluate((video) => ({
      controls: video.controls,
      muted: video.muted,
      paused: video.paused,
    })),
  ).toEqual({ controls: true, muted: false, paused: false });
  await expect(page.locator("#vision-film track")).toHaveAttribute(
    "src",
    "assets/vision-film-20261104.vtt",
  );
});

test("failed story media keeps the poster and exposes a retry", async ({
  browser,
}) => {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.route("**/assets/vision-film-20261104.mp4", (route) =>
    route.abort(),
  );
  await page.goto("./");
  await page.locator("[data-vision-play]").click();
  await expect(page.locator("[data-vision-status]")).toContainText(
    "could not start",
  );
  await expect(page.locator("[data-vision-play]")).toBeVisible();
  await expect(page.locator("#vision-film")).toHaveAttribute(
    "poster",
    "assets/vision-poster-20261104.webp",
  );
  await context.close();
});

test.describe("phone navigation", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test("menu closes with Escape, outside click and link selection", async ({
    page,
  }) => {
    await page.goto("./");
    const toggle = page.locator(".nav-toggle");
    await toggle.tap();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
    await toggle.tap();
    await page.mouse.click(200, 740);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.tap();
    await page.locator('#nav a[href="#faqs"]').click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});

test("native FAQ, currency selection and saving make no external submission", async ({
  page,
}) => {
  const writes = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url());
  });
  await page.goto("./");
  await expect(page.locator("#faqs details")).toHaveCount(4);
  await page.locator("#faqs summary").first().click();
  await expect(page.locator("#faqs details").first()).toHaveAttribute(
    "open",
    "",
  );
  await page.locator('[data-currency="BWP"]').click();
  await expect(page.locator("[data-currency-preview]")).toContainText(
    "Botswana Pula",
  );
  await page.locator("[data-save-choice]").click();
  await expect(page.locator("[data-save-status]")).toContainText(
    "Saved on this device",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("alpha-life-currency")),
  ).toBe("BWP");
  expect(writes).toEqual([]);
});

test("blocked storage reports the limit without breaking choice", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new Error("blocked");
    };
  });
  await page.goto("./");
  await page.locator('[data-currency="EUR"]').click();
  await page.locator("[data-save-choice]").click();
  await expect(page.locator("[data-save-status]")).toContainText(
    "Storage is blocked",
  );
  await expect(page.locator("[data-currency-preview]")).toContainText("Euro");
});

test("stored choice is constrained to the approved currency list", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("alpha-life-currency", "__proto__"),
  );
  await page.goto("./");
  await expect(page.locator("[data-currency-preview]")).toContainText(
    "US Dollars",
  );
  await expect(page.locator('[data-currency="USD"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

for (const [width, height] of [
  [360, 800],
  [390, 844],
  [768, 1024],
  [1440, 900],
]) {
  test(`content and controls fit at ${width}x${height}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.goto("./");
    const geometry = await page.evaluate(() => {
      const items = [
        ...document.querySelectorAll(
          ".hero h1,.hero-lede,.currency-button,.vision-player,.save-row,[data-save-choice]",
        ),
      ];
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped: items
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.left < -1 || rect.right > innerWidth + 1;
          })
          .map((element) => element.className),
      };
    });
    expect(geometry).toEqual({ overflow: false, clipped: [] });
    await context.close();
  });
}

test("no-JavaScript keeps the headline, mobile anchors and FAQ readable", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("./");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("#nav")).toBeVisible();
  await page.locator('#nav a[href="#faqs"]').click();
  await expect(page.locator("#faqs")).toBeInViewport();
  await page.locator("#faqs summary").first().click();
  await expect(page.locator("#faqs details").first()).toHaveAttribute(
    "open",
    "",
  );
  await context.close();
});

test("service worker isolates its cache and excludes eager movie downloads", () => {
  const source = read("sw.js");
  expect(source).toContain("alpha-life-preview-");
  expect(source).toMatch(/key\.startsWith\(PREFIX\)/);
  expect(source).toMatch(/request\.mode\s*===\s*['"]navigate['"]/);
  const core = source.split("const CORE")[1].split("const INDEX")[0];
  expect(core).toContain("savanna-walk-poster.webp");
  expect(core).not.toContain(".mp4");
});

test("core offline reading, currency selection, FAQ and posters survive reload", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.locator("h1")).toHaveText(
    "Life insurance in the currency of your choice",
  );
  await page.locator('[data-currency="EUR"]').click();
  await expect(page.locator("[data-currency-preview]")).toContainText("Euro");
  await page.locator("#faqs summary").first().click();
  await expect(page.locator("#faqs details").first()).toHaveAttribute(
    "open",
    "",
  );
  expect(
    await page
      .locator(".hero-poster")
      .evaluate((image) => image.complete && image.naturalWidth > 0),
  ).toBe(true);
});

test("non-settling story play shows a bounded retry instead of hanging", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      return this.id === "vision-film"
        ? new Promise(() => {})
        : original.call(this);
    };
  });
  await page.goto("./");
  await page.locator("[data-vision-play]").click();
  await expect(page.locator("[data-vision-status]")).toContainText(
    "could not start",
    { timeout: 12000 },
  );
  await expect(page.locator("[data-vision-play]")).toBeVisible();
});
