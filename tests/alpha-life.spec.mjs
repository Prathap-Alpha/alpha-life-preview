import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const rgb = s => s.match(/[\d.]+/g).slice(0, 3).map(Number);
const BRAND_LOGO_SHA = '0628b69f179ed486b451d2a5150d5f6b027c28e97839440dc2b894b1129479e8';

test.describe('brand and copy', () => {
  test('no electric blue, pink or lilac left in source', () => {
    const src = ['index.html', 'styles.css', 'main.js'].map(read).join('\n');
    const old = [/#0E52E3/i, /#0A43BD/i, /#CFDCFB/i, /#A6B2F8/i, /#C9D5FA/i, /#2F67EE/i, /#3D2BD8/i, /#6E5BFF/i, /#F7A99B/i, /#1244B0/i,
      /rgb\(\s*14\s*,\s*82\s*,\s*227/, /rgba\(\s*51\s*,\s*0\s*,\s*255/, /rgb\(\s*242\s*,\s*91\s*,\s*69/, /rgba\(\s*25\s*,\s*18\s*,\s*101/, /#191265/i];
    for (const re of old) expect(src, String(re)).not.toMatch(re);
  });
  test('banned wording is gone', async ({ page }) => {
    await page.goto('./');
    const text = await page.locator('body').innerText();
    for (const w of ['Stay close', 'Private preview', 'AI-first', 'AI‑first']) expect(text).not.toContain(w);
    expect(await page.locator('.chips').count()).toBe(0);
    expect(await page.locator('svg circle[r="15"]').count()).toBe(0); // old circled-A mark
  });
  test('official logo is the unchanged brand file, undistorted, on a light background only', async ({ page }) => {
    expect(crypto.createHash('sha256').update(fs.readFileSync(new URL('../assets/alpha-direct-logo.png', import.meta.url))).digest('hex')).toBe(BRAND_LOGO_SHA);
    await page.goto('./');
    const logos = await page.locator('img.logo__img').all();
    expect(logos.length).toBe(2); // header + footer
    for (const img of logos) {
      await img.scrollIntoViewIfNeeded();
      const m = await img.evaluate(el => {
        const b = el.getBoundingClientRect(); let n = el, bg = 'rgba(0, 0, 0, 0)';
        while (n && /rgba\(0, 0, 0, 0\)|transparent/.test(bg)) { bg = getComputedStyle(n).backgroundColor; n = n.parentElement; }
        return { w: b.width, h: b.height, nw: el.naturalWidth, nh: el.naturalHeight, bg, filter: getComputedStyle(el).filter, src: el.getAttribute('src') };
      });
      expect(m.src).toBe('assets/alpha-direct-logo.png');
      expect(Math.abs(m.w / m.h - m.nw / m.nh)).toBeLessThan(0.02);
      expect(m.filter).toBe('none');
      expect(lum(rgb(m.bg))).toBeGreaterThan(0.8);
    }
  });
  test('every button is white on navy and meets 4.5:1', async ({ page }) => {
    await page.goto('./');
    for (const b of await page.locator('.btn').all()) {
      const [c, bg] = await b.evaluate(el => { const s = getComputedStyle(el); return [s.color, s.backgroundColor]; });
      expect(bg).toBe('rgb(29, 50, 112)');
      expect(ratio(rgb(c), rgb(bg))).toBeGreaterThanOrEqual(4.5);
    }
  });
  test('orange text only sits on navy or ink', async ({ page }) => {
    await page.goto('./');
    const bad = await page.evaluate(() => [...document.querySelectorAll('body *')]
      .filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && getComputedStyle(e).color === 'rgb(244, 124, 32)')
      .map(e => String(e.className)));
    for (const c of bad) expect(c).toMatch(/dcard|announce|^$/);
    const css = read('styles.css');
    expect(css).toContain('.announce{display:block;height:42px;line-height:42px;background:var(--blue)');
  });
  test('palette tokens are the approved ones', () => {
    const css = read('styles.css');
    expect(css).toContain('--navy:#1D3270');
    expect(css).toContain('--orange:#F47C20');
  });
});

test.describe('menu', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test('Escape closes and returns focus; outside tap closes; resize resets', async ({ page }) => {
    await page.goto('./');
    const toggle = page.locator('.nav-toggle'), nav = page.locator('#nav');
    await toggle.tap(); await expect(toggle).toHaveAttribute('aria-expanded', 'true'); await expect(nav).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false'); await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.tap(); await expect(nav).toBeVisible();
    await page.mouse.click(200, 700);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.tap(); await expect(nav).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(nav).toBeHidden();
  });
  test('keyboard: first Tab stop is the skip link, menu opens by keyboard', async ({ page }) => {
    await page.goto('./');
    await page.keyboard.press('Tab'); await expect(page.locator('.skip')).toBeFocused();
    await page.locator('.nav-toggle').focus(); await page.keyboard.press('Enter');
    await expect(page.locator('#nav')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.locator('.nav-toggle')).toBeFocused();
  });
  test('menu link closes the menu', async ({ page }) => {
    await page.goto('./'); await page.locator('.nav-toggle').tap(); await page.locator('#nav a[href="#how"]').tap();
    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('media and motion', () => {
  test('two live shader canvases, lazy muted videos', async ({ page }) => {
    await page.goto('./');
    expect(await page.locator('canvas[data-paper-shaders]').count()).toBe(2);
    for (const v of await page.locator('video').all()) {
      expect(await v.getAttribute('preload')).toBe('none');
      expect(await v.evaluate(e => e.muted && e.loop && e.playsInline)).toBe(true);
      expect(await v.locator('source').getAttribute('src')).toBeNull(); // nothing downloads before it nears the screen
    }
  });
  test('videos get their source only when scrolled to, and the file is served', async ({ page }) => {
    await page.goto('./');
    const v = page.locator('#how video');
    await v.scrollIntoViewIfNeeded();
    await expect(v.locator('source')).toHaveAttribute('src', 'assets/overview-loop.mp4');
    const r = await page.request.get('./assets/overview-loop.mp4');
    expect(r.status()).toBe(200);
    expect((await r.body()).length).toBeGreaterThan(100000); // bundled test Chromium has no H.264, so playback itself is checked in real Chrome
  });
  test('all photos load', async ({ page }) => {
    await page.goto('./');
    for (const img of await page.locator('main img').all()) await img.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    for (const img of await page.locator('main img').all()) expect(await img.evaluate(e => e.complete && e.naturalWidth > 0)).toBe(true);
  });
  test('missing asset: page still works, alt text kept, no overflow', async ({ page }) => {
    await page.route('**/assets/moment-1.jpg', r => r.abort());
    await page.route('**/assets/overview-loop.mp4', r => r.abort());
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('./'); await page.locator('#moments').scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
    expect(errors).toEqual([]);
    expect(await page.locator('.moment img').first().getAttribute('alt')).toContain('baobab');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test('reduced motion: content visible, videos not auto-loaded', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' }); const p = await ctx.newPage();
    await p.goto('./');
    expect(await p.locator('#how h2 .w').first().evaluate(e => getComputedStyle(e).opacity)).toBe('1');
    expect(await p.locator('#how video source').getAttribute('src')).toBeNull();
    await ctx.close();
  });
  test('no-JS: content is visible', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false }); const p = await ctx.newPage();
    await p.goto('./');
    expect(await p.locator('.moment').first().isVisible()).toBe(true);
    expect(await p.locator('.rise').first().evaluate(e => getComputedStyle(e).opacity)).toBe('1');
    await ctx.close();
  });
});

for (const [w, h] of [[1440, 900], [1280, 900], [768, 1024], [390, 844], [360, 800]]) {
  test(`no horizontal overflow or page errors at ${w}x${h}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
    const errors = []; p.on('pageerror', e => errors.push(e.message));
    await p.goto('./'); await p.waitForTimeout(500);
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await ctx.close();
  });
}

test('credits list every media file', () => {
  const credits = read('CREDITS.md');
  for (const f of fs.readdirSync(new URL('../assets', import.meta.url))) expect(credits, f).toContain(f);
});
