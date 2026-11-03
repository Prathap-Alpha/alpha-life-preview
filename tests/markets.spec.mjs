import { test, expect } from '@playwright/test';

const markets = [
  ['nigeria', 'Nigeria'],
  ['zambia', 'Zambia'],
  ['zimbabwe', 'Zimbabwe'],
  ['kenya', 'Kenya'],
  ['south-africa', 'South Africa'],
  ['namibia', 'Namibia'],
  ['botswana', 'Botswana'],
];

test.describe('marketing-demo market selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#markets')).toBeVisible();
  });

  test('defaults to South Africa with a useful no-JS-readable detail', async ({ page }) => {
    await expect(page.locator('[data-market="south-africa"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-market-detail-title]')).toHaveText('Life cover for South Africa.');
    await expect(page.locator('[data-market-detail-copy]')).toContainText('digital customer experience');
    await expect(page.locator('.market-disclaimer')).toHaveText('Illustrative country experience — not a live insurance offer.');
    await expect(page.locator('.community-message')).toHaveText('No notices published in this demo.');
  });

  for (const [slug, name] of markets) {
    test(`updates to ${name} and marks only its button active`, async ({ page }) => {
      await page.locator(`[data-market="${slug}"]`).click();
      await expect(page.locator('[data-market-detail-title]')).toHaveText(`Life cover for ${name}.`);
      await expect(page.locator(`[data-market="${slug}"]`)).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('[data-market][aria-pressed="true"]')).toHaveCount(1);
      await expect(page.locator('[data-market-status]')).toContainText(name);
    });
  }

  test('keeps the section inside the viewport at mobile and desktop widths', async ({ page }) => {
    for (const width of [360, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.reload();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `horizontal overflow at ${width}px`).toBe(false);
      await expect(page.locator('#markets')).toBeVisible();
    }
  });

  test('switches the community demo tab while keeping the empty state', async ({ page }) => {
    const remembrance = page.locator('[data-community-tab="remembrance"]');
    await remembrance.click();
    await expect(remembrance).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-community-tab="events"]')).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('[data-community-message]')).toHaveText('No notices published in this demo.');
  });
});
