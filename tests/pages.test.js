import { describe, expect, it } from 'vitest';
import menu from '../src/components/top-menu/menu.json';
import pages from '../src/pages/pages.json';
import { PAGE_CONTENT, PAGE_IDS, pageLabel } from '../src/pages/pageContent.js';
import { validatePages, themeOf } from '../src/pages/pagesSchema.js';
import { validateMenu } from '../src/components/top-menu/menuSchema.js';
import { THEME_IDS } from '../src/pages/themes.js';
import { buildStoryFiles } from '../.storybook/generateStories.js';
import { CARD_STORY_KEYS } from '../src/pages/storybook/cardStories.jsx';

describe('pages', () => {
  it('accepts the saved pages and menu unchanged', () => {
    expect(validatePages(pages)).toEqual(pages);
    expect(validateMenu(menu)).toEqual(menu);
  });

  it('has Doing on the Default theme and Exploring on Geek', () => {
    expect(THEME_IDS).toEqual(['default', 'geek']);
    expect(themeOf(pages, 'doing')).toBe('default');
    expect(themeOf(pages, 'exploring')).toBe('geek');
  });

  it('keeps every page that exists in code', () => {
    expect(() => validatePages({ pages: pages.pages.filter((p) => p.id !== 'exploring') })).toThrow(/Missing page/);
  });

  it.each([
    ['unknown id', { pages: [...pages.pages, { id: 'nope', name: 'Nope', theme: 'default' }] }],
    ['unknown theme', { pages: pages.pages.map((p) => ({ ...p, theme: 'dark' })) }],
    ['empty name', { pages: pages.pages.map((p) => ({ ...p, name: ' ' })) }],
  ])('rejects %s', (_, value) => {
    expect(() => validatePages(value)).toThrow();
  });

  it('has a setup story for everything listed on a page', () => {
    for (const entries of Object.values(PAGE_CONTENT)) for (const { key } of entries) expect(CARD_STORY_KEYS).toContain(key);
  });

  it('puts the sections on the Doing page', () => {
    expect(PAGE_CONTENT.doing.map((e) => e.key)).toContain('sections');
  });
});

describe('pageLabel', () => {
  it('uses the label of the first item that opens the page', () => {
    const renamed = { items: [{ id: 'x', label: 'Work', page: 'doing' }] };
    expect(pageLabel('doing', renamed, pages)).toBe('Work');
  });

  it("falls back to the page's own name when no item opens it", () => {
    expect(pageLabel('exploring', { items: [] }, pages)).toBe('Exploring');
  });
});

describe('generated stories', () => {
  it('names pages and card groups after the top navigation', () => {
    const renamed = { items: [{ id: 'x', label: 'Work', page: 'doing' }] };
    const files = buildStoryFiles({ menu: renamed, pages });
    expect(files['pages/Pages.stories.jsx']).toContain('name: "Work"');
    expect(files['home-cards/CardsDoing.stories.jsx']).toContain('title: "Components/Cards/Work"');
  });

  it('keeps pages that no item opens', () => {
    const files = buildStoryFiles({ menu: { items: [{ id: 'x', label: 'Doing', page: 'doing' }] }, pages });
    expect(files['pages/Pages.stories.jsx']).toContain('pageId="exploring"');
    expect(files['home-cards/CardsExploring.stories.jsx']).toContain('title: "Components/Cards/Exploring"');
  });

  it('writes one story per page and per card', () => {
    const files = buildStoryFiles({ menu, pages });
    expect(files['pages/Pages.stories.jsx'].match(/^export const /gm)).toHaveLength(PAGE_IDS.length);
    expect(files['home-cards/CardsExploring.stories.jsx'].match(/^export const /gm)).toHaveLength(PAGE_CONTENT.exploring.length);
  });
});
