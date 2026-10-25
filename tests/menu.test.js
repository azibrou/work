import { describe, expect, it } from 'vitest';
import menu from '../src/components/top-menu/menu.json';
import { validateMenu, uniqueId, slugify, MAX_ITEMS } from '../src/components/top-menu/menuSchema.js';

describe('validateMenu', () => {
  it('accepts the saved menu unchanged', () => {
    expect(validateMenu(menu)).toEqual(menu);
  });

  it('keeps the "doing" item that shows the project tiles', () => {
    expect(menu.items.map((i) => i.id)).toContain('doing');
  });

  it('trims labels and drops unknown keys', () => {
    expect(validateMenu({ items: [{ id: 'a', label: ' A ', page: 'doing', transition: 'default', extra: 1 }], other: 2 })).toEqual({
      items: [{ id: 'a', label: 'A', page: 'doing', transition: 'default' }],
    });
  });

  it('fills in the Default transition and keeps a known one', () => {
    expect(validateMenu({ items: [{ id: 'a', label: 'A', page: 'doing' }] }).items[0].transition).toBe('default');
    expect(validateMenu({ items: [{ id: 'a', label: 'A', page: 'doing', transition: 'one-bit' }] }).items[0].transition).toBe('one-bit');
  });

  it('lets two items open the same page and leaves other pages unlinked', () => {
    const items = [
      { id: 'a', label: 'A', page: 'doing', transition: 'default' },
      { id: 'b', label: 'B', page: 'doing', transition: 'one-bit' },
    ];
    expect(validateMenu({ items }).items).toEqual(items);
  });

  it('checks pages against the given list', () => {
    expect(validateMenu({ items: [{ id: 'a', label: 'A', page: 'talks' }] }, ['talks']).items[0].page).toBe('talks');
  });

  it.each([
    ['unknown transition', { items: [{ id: 'a', label: 'A', page: 'doing', transition: 'fade' }] }],
    ['unknown page', { items: [{ id: 'a', label: 'A', page: 'nope' }] }],
    ['missing page', { items: [{ id: 'a', label: 'A' }] }],
    ['no items', { items: [] }],
    ['too many items', { items: Array.from({ length: MAX_ITEMS + 1 }, (_, i) => ({ id: `i${i}`, label: `I${i}`, page: 'doing' })) }],
    ['empty label', { items: [{ id: 'a', label: '  ', page: 'doing' }] }],
    ['long label', { items: [{ id: 'a', label: 'x'.repeat(31), page: 'doing' }] }],
    ['bad id', { items: [{ id: 'Bad Id', label: 'A', page: 'doing' }] }],
    ['duplicate id', { items: [{ id: 'a', label: 'A', page: 'doing' }, { id: 'a', label: 'B', page: 'doing' }] }],
    ['duplicate label', { items: [{ id: 'a', label: 'Same', page: 'doing' }, { id: 'b', label: 'same', page: 'doing' }] }],
    ['missing items', {}],
  ])('rejects %s', (_, value) => {
    expect(() => validateMenu(value)).toThrow();
  });
});

describe('uniqueId', () => {
  it('slugs the label', () => {
    expect(slugify('Side Projects!')).toBe('side-projects');
    expect(slugify('***')).toBe('item');
  });

  it('avoids ids already in use', () => {
    expect(uniqueId('Doing', menu.items)).toBe('doing-2');
    expect(uniqueId('Talks', menu.items)).toBe('talks');
  });
});
