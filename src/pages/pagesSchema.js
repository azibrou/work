// Shared by the page setup (browser) and the save endpoint (node). Keep free of node/browser APIs.
import { PAGE_IDS } from './pageContent.js';
import { DEFAULT_THEME, THEME_IDS } from './themes.js';

export const MAX_PAGE_NAME = 30;

function fail(message) {
  throw new Error(message);
}

export function validatePages(data, knownIds = PAGE_IDS) {
  const list = Array.isArray(data?.pages) ? data.pages : fail('Pages must be a list');
  const seen = new Set();
  const pages = list.map((page, index) => {
    const n = index + 1;
    const id = knownIds.includes(page?.id) ? page.id : fail(`Page ${n} has an unknown id "${page?.id}"`);
    if (seen.has(id)) fail(`Two pages share the id "${id}"`);
    seen.add(id);
    const name = typeof page.name === 'string' ? page.name.trim() : '';
    if (!name || name.length > MAX_PAGE_NAME) fail(`Page ${n} needs a name up to ${MAX_PAGE_NAME} characters`);
    const theme = page.theme ?? DEFAULT_THEME;
    if (!THEME_IDS.includes(theme)) fail(`Page ${n} has an unknown theme "${theme}"`);
    return { id, name, theme };
  });
  // Every page that exists in code keeps an entry, so pages are never lost.
  const missing = knownIds.filter((id) => !seen.has(id));
  if (missing.length) fail(`Missing page(s): ${missing.join(', ')}`);
  return { pages };
}

export const themeOf = (pages, pageId) => pages.pages.find((p) => p.id === pageId)?.theme ?? DEFAULT_THEME;
