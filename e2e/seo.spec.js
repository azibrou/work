import { test, expect } from '@playwright/test';

test.describe('SEO basics', () => {
  test.beforeEach(async ({ page }) => page.goto('/'));

  test('html lang is set', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', /.+/);
  });

  test('title is 10-60 chars', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThanOrEqual(10);
    expect(title.length).toBeLessThanOrEqual(60);
  });

  test('meta description is 50-160 chars', async ({ page }) => {
    const c = await page.locator('meta[name="description"]').getAttribute('content');
    expect(c?.length ?? 0).toBeGreaterThanOrEqual(50);
    expect(c.length).toBeLessThanOrEqual(160);
  });

  test('viewport meta present', async ({ page }) => {
    await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
  });

  test('exactly one h1', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('images have alt text', async ({ page }) => {
    const missing = await page.locator('img:not([alt])').count();
    expect(missing).toBe(0);
  });

  test('canonical link present', async ({ page }) => {
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  });

  test('Open Graph title and description present', async ({ page }) => {
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
  });

  test('links have discernible text', async ({ page }) => {
    const empty = await page.locator('a').evaluateAll(as =>
      as.filter(a => !(a.textContent.trim() || a.getAttribute('aria-label') || a.querySelector('img[alt]'))).length);
    expect(empty).toBe(0);
  });
});
