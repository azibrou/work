// Shared by the shelf setup page (browser) and the save endpoint (node). Keep free of node/browser APIs.
import { FONT_FAMILIES, HEADLINE_TYPES } from '../home-cards/cardSchema.js';
import { TEXT_COLOR_TOKENS } from '../memo/memoSchema.js';

export const MAX_BOOKS = 40;
export const MAX_TITLE = 80;
// What one press of the arrow buttons scrolls by: one cover, or every cover in view.
export const SCROLL_STEPS = ['cover', 'page'];
const TEXT_COLORS = TEXT_COLOR_TOKENS.map((t) => t.cssVar);
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function fail(message) {
  throw new Error(message);
}

const text = (value, name, max) =>
  typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : fail(`${name} must be text up to ${max} characters`);
const oneOf = (value, options, name) => (options.includes(value) ? value : fail(`${name} has an invalid value`));

export function validateShelf(s) {
  const list = Array.isArray(s?.books) ? s.books : fail('Books must be a list');
  if (list.length < 1 || list.length > MAX_BOOKS) fail(`Keep 1-${MAX_BOOKS} books`);
  const ids = new Set();
  const books = list.map((b, index) => {
    const n = index + 1;
    const id = typeof b?.id === 'string' && ID.test(b.id) ? b.id : fail(`Book ${n} has an invalid id`);
    if (ids.has(id)) fail(`Two books share the id "${id}"`);
    ids.add(id);
    return { id, title: text(b.title, `Book ${n} title`, MAX_TITLE) };
  });

  return {
    headline: text(s.headline, 'Headline', 120),
    headlineFont: oneOf(s.headlineFont, FONT_FAMILIES, 'Headline font'),
    headlineSize: oneOf(s.headlineSize, HEADLINE_TYPES, 'Headline size'),
    headlineColor: oneOf(s.headlineColor, TEXT_COLORS, 'Headline color'),
    scrollStep: oneOf(s.scrollStep, SCROLL_STEPS, 'Scroll step'),
    books,
  };
}

// The first unused "book-<n>" id.
export function nextBookId(books) {
  const taken = new Set(books.map((b) => b.id));
  let n = books.length + 1;
  while (taken.has(`book-${n}`)) n += 1;
  return `book-${n}`;
}
