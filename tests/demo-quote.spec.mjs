import { test, expect } from "@playwright/test";

test("demo quote section shows its ribbon and sends nothing on load", async ({ page }) => {
  const writes = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url());
  });
  await page.goto("./");
  await expect(page.locator("#quote .demo-ribbon")).toContainText("DEMO: no real cover");
  await expect(page.locator("#quote")).toBeAttached();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  expect(writes).toEqual([]);
});

test("a quote is priced from the API answer", async ({ page }) => {
  await page.route("**/api/v1/alpha-life-demo/quote/", (route) =>
    route.fulfill({ json: { name: "Starter", product: "starter", cover: "5000", currency: "USD", monthly_premium: "5.00", monthly_premium_usd: "5.00", approx: false, note: "", demo: true } }),
  );
  await page.goto("./");
  await page.selectOption("#q-product", "starter");
  await page.locator("#form-quote input[type=date]").fill("2000-01-01");
  await page.locator('#form-quote [type=submit]').click();
  await expect(page.locator("#quote")).toContainText("5.00");
});
