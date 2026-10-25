// Shared by the memo setup page (browser) and the save endpoint (node). Keep free of node/browser APIs.
import colorTokens from '../../tokens/color/color.json';
import { FONT_FAMILIES, FONT_OPTIONS, FONT_VARS, HEADLINE_TYPES, DESCRIPTION_SIZES } from '../home-cards/cardSchema.js';

export { FONT_FAMILIES, FONT_OPTIONS, FONT_VARS, DESCRIPTION_SIZES };
// "memo" is the display style from Tokens/Typography; h1-h6 reuse the heading scale.
export const HEADLINE_SIZES = ['memo', ...HEADLINE_TYPES];

// Text colors are the Content group from Tokens/Color, stored by CSS variable name.
export const TEXT_COLOR_TOKENS = colorTokens.groups.find((g) => g.name === 'Content')?.tokens ?? [];
export const TEXT_COLOR_OPTIONS = TEXT_COLOR_TOKENS.map((t) => ({ value: t.cssVar, label: t.label }));
const TEXT_COLORS = TEXT_COLOR_TOKENS.map((t) => t.cssVar);

function fail(message) {
  throw new Error(message);
}

const text = (value, name, max) =>
  typeof value === 'string' && value.trim() && value.length <= max ? value : fail(`${name} must be text up to ${max} characters`);
const int = (value, min, max, name) =>
  Number.isInteger(value) && value >= min && value <= max ? value : fail(`${name} must be a whole number ${min}-${max}`);
const oneOf =(value, options, name) => (options.includes(value) ? value : fail(`${name} has an invalid value`));

export const MAX_MEMOS = 20;
export const MAX_NAME = 40;
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// The content and style of one memo.
export function validateMemo(m) {
  return {
    headline: text(m.headline, 'Headline', 120),
    headlineFont: oneOf(m.headlineFont, FONT_FAMILIES, 'Headline font'),
    headlineSize: oneOf(m.headlineSize, HEADLINE_SIZES, 'Headline size'),
    headlineColor: oneOf(m.headlineColor, TEXT_COLORS, 'Headline color'),
    description: text(m.description, 'Description', 1200),
    descriptionFont: oneOf(m.descriptionFont, FONT_FAMILIES, 'Description font'),
    descriptionSize: oneOf(m.descriptionSize, DESCRIPTION_SIZES, 'Description size'),
    descriptionColor: oneOf(m.descriptionColor, TEXT_COLORS, 'Description color'),
    enterDuration: int(m.enterDuration, 0, 5000, 'Duration'),
    enterDistance: int(m.enterDistance, 0, 400, 'Distance'),
  };
}

// memo.json: every memo (edited under Memos in Storybook) and which one each
// page shows. `pages` is keyed by top-menu item id; a page that isn't listed
// shows no memo.
export function validateMemoLibrary(lib) {
  const list = Array.isArray(lib?.memos) ? lib.memos : fail('Memos must be a list');
  if (list.length < 1 || list.length > MAX_MEMOS) fail(`Keep 1-${MAX_MEMOS} memos`);

  const ids = new Set();
  const names = new Set();
  const memos = list.map((m, index) => {
    const n = index + 1;
    const id = typeof m?.id === 'string' && ID.test(m.id) ? m.id : fail(`Memo ${n} has an invalid id`);
    const name = typeof m.name === 'string' ? m.name.trim() : '';
    if (!name || name.length > MAX_NAME) fail(`Memo ${n} needs a name up to ${MAX_NAME} characters`);
    if (ids.has(id)) fail(`Two memos share the id "${id}"`);
    if (names.has(name.toLowerCase())) fail(`Two memos are called "${name}"`);
    ids.add(id);
    names.add(name.toLowerCase());
    try {
      return { id, name, ...validateMemo(m) };
    } catch (error) {
      return fail(`${name}: ${error.message}`);
    }
  });

  const raw = lib.pages ?? {};
  if (typeof raw !== 'object' || Array.isArray(raw)) fail('Pages must map page ids to memo ids');
  const pages = {};
  for (const [pageId, memoId] of Object.entries(raw)) {
    if (!ID.test(pageId)) fail(`Invalid page id "${pageId}"`);
    if (memoId === null || memoId === '') continue; // no memo on this page
    if (!ids.has(memoId)) fail(`Page "${pageId}" uses a memo that doesn't exist ("${memoId}")`);
    pages[pageId] = memoId;
  }
  return { memos, pages };
}

// The memo a page shows, or null.
export function memoForPage(lib, pageId) {
  const memoId = lib.pages?.[pageId];
  return lib.memos.find((m) => m.id === memoId) ?? null;
}
