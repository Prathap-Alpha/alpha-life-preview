import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import crypto from 'node:crypto';

const asset = name => new URL(`../assets/${name}`, import.meta.url);
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const approvedWebPSHA = {
  '01-young-family.webp': '5ed12b94eb4cfe0f27bd6a823876a2102b9ac6fe00f640ea14924a709b2f2ccc',
  '02-family-together.webp': '27de2b86b6f7038cdf9412644d2cfb0a2c925be7ac72c0fa4fa85b0f6f6e2fb2',
  '03-working-adult.webp': '236fa5f8dd6649623608c2832b9cb833f8c3382e211a98a9afcd926217a2babe',
  '04-later-life.webp': 'a32ae2aeeb074420747857be62b3fa759abb0bf4dd6593a0e5355aeb0c707099',
};

const film = page => page.locator('#savanna-film');
const source = page => film(page).locator('source');
const filmButton = page => page.locator('button.film-toggle[data-video="savanna-film"]');

async function bringFilmOnscreen(page) {
  await page.goto('./');
  await film(page).scrollIntoViewIfNeeded();
}

test.describe('media update', () => {
  test('editorial WebPs match the approved ZIP hashes', () => {
    for (const [name, expected] of Object.entries(approvedWebPSHA)) {
      expect(sha256(asset(name))).toBe(expected);
    }
  });

  test('editorial visual panels use photos rather than SVG artwork', async ({ page }) => {
    await page.goto('./');
    expect(await page.locator('main .split__media svg').count()).toBe(0);
    await expect(page.locator('.promise .split__media img.pic')).toHaveAttribute('src', 'assets/02-family-together.webp');
    await expect(page.locator('.status .split__media img.pic')).toHaveAttribute('src', 'assets/03-working-adult.webp');
    await expect(page.locator('#how .split__media img.pic')).toHaveAttribute('src', 'assets/01-young-family.webp');
  });

  test('failed editorial image keeps alt text and layout without page errors', async ({ page }) => {
    await page.route('**/assets/02-family-together.webp', route => route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('./');
    const image = page.locator('.promise .split__media img.pic');
    await image.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    expect(await image.getAttribute('alt')).toBeTruthy();
    const box = await image.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });

  test('normal film playback reaches ready state and advances', async ({ page }) => {
    await bringFilmOnscreen(page);
    await expect.poll(() => film(page).evaluate(video => video.readyState), { timeout: 15000 }).toBeGreaterThanOrEqual(2);
    const before = await film(page).evaluate(video => video.currentTime);
    await film(page).evaluate(video => video.play());
    await expect.poll(() => film(page).evaluate(video => video.currentTime), { timeout: 10000 }).toBeGreaterThan(before + 0.05);
  });

  test('reduced motion leaves the film unloaded until the explicit play button', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = function () {
        this.__alphaLifePlayCalled = true;
        return Promise.resolve();
      };
    });
    await bringFilmOnscreen(page);
    expect(await film(page).getAttribute('src')).toBeFalsy();
    expect(await source(page).getAttribute('src')).toBeFalsy();
    await expect(filmButton(page)).toBeVisible();
    await filmButton(page).click();
    await expect.poll(() => source(page).getAttribute('src')).toContain('savanna-walk.mp4');
    expect(await film(page).evaluate(video => video.__alphaLifePlayCalled)).toBe(true);
    await context.close();
  });

  test('save-data leaves the film source unloaded initially', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'connection', {
        configurable: true,
        get: () => ({ saveData: true }),
      });
    });
    await bringFilmOnscreen(page);
    expect(await film(page).getAttribute('src')).toBeFalsy();
    expect(await source(page).getAttribute('src')).toBeFalsy();
    await expect(filmButton(page)).toBeVisible();
    await context.close();
  });

  test('pause button leaves the onscreen film paused', async ({ page }) => {
    await bringFilmOnscreen(page);
    await expect.poll(() => film(page).evaluate(video => video.readyState), { timeout: 15000 }).toBeGreaterThanOrEqual(2);
    await film(page).evaluate(video => video.play());
    await expect.poll(() => film(page).evaluate(video => video.currentTime), { timeout: 10000 }).toBeGreaterThan(0.05);
    await filmButton(page).click();
    await expect(filmButton(page)).toHaveText('Play film');
    expect(await film(page).evaluate(video => video.paused)).toBe(true);
    const pausedAt = await film(page).evaluate(video => video.currentTime);
    await page.waitForTimeout(350);
    expect(await film(page).evaluate(video => video.paused)).toBe(true);
    expect(await film(page).evaluate(video => video.currentTime)).toBeCloseTo(pausedAt, 1);
  });

  test('failed film playback keeps the poster visible and exposes Play film', async ({ page }) => {
    await page.route('**/assets/savanna-walk.mp4', route => route.abort());
    await bringFilmOnscreen(page);
    await expect(page.locator('img.film-poster')).toBeVisible();
    await expect(filmButton(page)).toBeVisible();
    await expect(filmButton(page)).toHaveText('Play film');
  });
});

test('film words enter slowly and express an ambition rather than current availability', async ({ page }) => {
  await bringFilmOnscreen(page);
  await expect(page.locator('.film-brand')).toHaveText('Alpha Life');
  await expect(page.locator('.film-copy h2')).toHaveText('A future worth protecting.');
  await expect(page.locator('.film-vision')).toHaveText('For your life. Across Africa.');
  await expect(page.locator('.film figcaption')).toContainText('AI-created brand film');
  await expect(page.locator('.film figcaption')).toContainText('Marketing demo only.');
  await expect.poll(() => film(page).evaluate(video => video.paused)).toBe(false);
  const timing = await page.locator('.film-vision').evaluate(el => {
    const style = getComputedStyle(el);
    return { duration: parseFloat(style.animationDuration), delay: parseFloat(style.animationDelay) };
  });
  expect(timing.duration).toBeGreaterThanOrEqual(3);
  expect(timing.delay).toBeGreaterThanOrEqual(2);
});


test('selected market and community controls meet text contrast requirements', async ({ page }) => {
  await page.goto('./');
  const ratios = await page.locator('.market-button[aria-pressed="true"], .community-button[aria-selected="true"]').evaluateAll(els => {
    const lum = color => {
      const rgb = color.match(/[\d.]+/g).slice(0,3).map(Number).map(n => n / 255);
      const linear = rgb.map(n => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4);
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    return els.map(el => {
      const style = getComputedStyle(el), values = [lum(style.color), lum(style.backgroundColor)].sort((a,b) => b-a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    });
  });
  expect(ratios).toHaveLength(2);
  for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
});
