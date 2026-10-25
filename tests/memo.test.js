import { describe, expect, it } from 'vitest';
import library from '../src/components/memo/memo.json';
import menu from '../src/components/top-menu/menu.json';
import { validateMemo, validateMemoLibrary, memoForPage, HEADLINE_SIZES, MAX_MEMOS } from '../src/components/memo/memoSchema.js';
import typography from '../src/tokens/typography/typography.json';

describe('HEADLINE_SIZES', () => {
  it('each has a style in the typography tokens', () => {
    for (const size of HEADLINE_SIZES) expect(typography.headings).toHaveProperty(size);
  });

  it('includes the 56px Memo style', () => {
    expect(HEADLINE_SIZES).toContain('memo');
    expect(typography.headings.memo.fontSize).toBe(56);
  });
});

// One memo's content and style, without the library's id and name.
const { id: _id, name: _name, ...memo } = library.memos[0];

describe('validateMemo', () => {
  it('accepts a saved memo unchanged', () => {
    expect(validateMemo(memo)).toEqual(memo);
  });

  it('drops unknown keys', () => {
    expect(validateMemo({ ...memo, extra: 1 })).not.toHaveProperty('extra');
  });

  it.each([
    ['headline', ''],
    ['headlineFont', 'comic-sans'],
    ['headlineSize', 'h7'],
    ['description', 'x'.repeat(1201)],
    ['descriptionSize', 'xl'],
    ['headlineColor', '#000000'],
    ['descriptionColor', '--color-floor-0'],
    ['enterDuration', -1],
    ['enterDuration', 12.5],
    ['enterDistance', 401],
    ['enterDistance', undefined],
  ])('rejects an invalid %s', (key, value) => {
    expect(() => validateMemo({ ...memo, [key]: value })).toThrow();
  });
});

describe('validateMemoLibrary', () => {
  const second = { ...library.memos[0], id: 'other', name: 'Other' };
  const make = (overrides) => ({ memos: [library.memos[0], second], pages: { doing: library.memos[0].id }, ...overrides });

  it('accepts the saved library unchanged', () => {
    expect(validateMemoLibrary(library)).toEqual(library);
  });

  it('gives every menu page that has a memo a memo that exists', () => {
    for (const item of menu.items) {
      if (library.pages[item.id]) expect(memoForPage(library, item.id)).not.toBeNull();
    }
  });

  it('drops pages set to no memo and trims names', () => {
    const clean = validateMemoLibrary(make({ memos: [{ ...second, name: ' Other ' }], pages: { doing: 'other', exploring: '' } }));
    expect(clean.pages).toEqual({ doing: 'other' });
    expect(clean.memos[0].name).toBe('Other');
  });

  it('finds the memo for a page, or null', () => {
    const lib = make({ pages: { doing: 'other' } });
    expect(memoForPage(lib, 'doing').id).toBe('other');
    expect(memoForPage(lib, 'talks')).toBeNull();
  });

  it.each([
    ['no memos', { memos: [] }],
    ['too many memos', { memos: Array.from({ length: MAX_MEMOS + 1 }, (_, i) => ({ ...second, id: `m${i}`, name: `M${i}` })) }],
    ['a bad id', { memos: [{ ...second, id: 'Bad Id' }] }],
    ['a duplicate id', { memos: [second, { ...second, name: 'Else' }], pages: {} }],
    ['a duplicate name', { memos: [second, { ...second, id: 'else', name: 'other' }], pages: {} }],
    ['an empty name', { memos: [{ ...second, name: ' ' }], pages: {} }],
    ['invalid memo content', { memos: [{ ...second, headline: '' }], pages: {} }],
    ['a page using a missing memo', { pages: { doing: 'nope' } }],
    ['a bad page id', { pages: { 'Bad Page': 'other' } }],
    ['pages as a list', { pages: ['other'] }],
  ])('rejects %s', (_, overrides) => {
    expect(() => validateMemoLibrary(make(overrides))).toThrow();
  });
});
