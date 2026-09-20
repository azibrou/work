import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const scheme of ['light', 'dark']) {
  test(`no WCAG AAA violations (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const summary = violations.map(v => `${v.id} (${v.nodes.length}): ${v.help}\n  ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join('\n  ')}`);
    expect(summary, summary.join('\n')).toEqual([]);
  });
}
