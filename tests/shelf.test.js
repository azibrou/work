import { describe, expect, it } from 'vitest';
import shelf from '../src/components/book-shelf/shelf.json';
import { validateShelf, nextBookId, MAX_BOOKS } from '../src/components/book-shelf/shelfSchema.js';
import { targetScroll } from '../src/components/book-shelf/scroll.js';

describe('validateShelf', () => {
  it('accepts the saved shelf unchanged', () => {
    expect(validateShelf(shelf)).toEqual(shelf);
  });

  it('trims titles and drops unknown keys', () => {
    const clean = validateShelf({ ...shelf, extra: 1, books: [{ id: 'a', title: ' A ', extra: 2 }] });
    expect(clean).not.toHaveProperty('extra');
    expect(clean.books).toEqual([{ id: 'a', title: 'A' }]);
  });

  it.each([
    ['headline', ''],
    ['headlineFont', 'comic-sans'],
    ['headlineSize', 'memo'],
    ['headlineColor', '--color-floor-0'],
    ['scrollStep', 'half'],
    ['books', []],
    ['books', Array.from({ length: MAX_BOOKS + 1 }, (_, i) => ({ id: `b${i}`, title: 'B' }))],
    ['books', [{ id: 'Bad', title: 'B' }]],
    ['books', [{ id: 'a', title: 'A' }, { id: 'a', title: 'B' }]],
    ['books', [{ id: 'a', title: '  ' }]],
  ])('rejects an invalid %s', (key, value) => {
    expect(() => validateShelf({ ...shelf, [key]: value })).toThrow();
  });
});

describe('nextBookId', () => {
  it('skips ids already in use', () => {
    expect(nextBookId([{ id: 'book-1' }, { id: 'book-3' }])).toBe('book-4');
    expect(nextBookId([{ id: 'x' }])).toBe('book-2');
  });
});

describe('targetScroll', () => {
  // Covers 198px wide with a 12px gap: each starts 210px after the last.
  const starts = Array.from({ length: 10 }, (_, i) => i * 210);
  const base = { starts, maxScroll: 1000, visible: 3, step: 'cover' };

  it('moves one cover at a time', () => {
    expect(targetScroll({ ...base, scrollLeft: 0, dir: 1 })).toBe(210);
    expect(targetScroll({ ...base, scrollLeft: 420, dir: -1 })).toBe(210);
  });

  it('moves a screenful in page mode', () => {
    expect(targetScroll({ ...base, step: 'page', scrollLeft: 0, dir: 1 })).toBe(630);
  });

  it('snaps a part-scrolled row to the next cover start', () => {
    expect(targetScroll({ ...base, scrollLeft: 100, dir: 1 })).toBe(210);
    expect(targetScroll({ ...base, scrollLeft: 100, dir: -1 })).toBe(0);
  });

  it('steps back from the very end, which may not line up with a cover', () => {
    expect(targetScroll({ ...base, scrollLeft: 1000, dir: -1 })).toBe(840);
  });

  it('stays inside the scroll range', () => {
    expect(targetScroll({ ...base, scrollLeft: 1000, dir: 1 })).toBe(1000);
    expect(targetScroll({ ...base, scrollLeft: 0, dir: -1 })).toBe(0);
  });
});
