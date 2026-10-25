// Finds where each spacing token is used, so the editor and the save endpoint can refuse
// to remove a token the page still needs. Keep free of node/browser APIs.
import { CARD_SPACING_KEYS } from '../../components/home-cards/cardSchema.js';
import { SECTION_SPACING_KEYS } from '../../components/sections/sectionsSchema.js';

const SPACE_REF = /--space-([a-z0-9]+(?:-[a-z0-9]+)*)/g;

// cards: cards.json, sections: sections.json, files: { [path]: source text } of the
// stylesheets and components. Returns { [tokenName]: ["where", ...] }.
export function findSpacingUses({ cards = {}, sections = {}, files = {} }) {
  const uses = {};
  const add = (name, where) => {
    uses[name] ??= [];
    if (!uses[name].includes(where)) uses[name].push(where);
  };

  for (const [cardId, card] of Object.entries(cards)) {
    for (const key of CARD_SPACING_KEYS) if (card[key]) add(card[key], `card ${cardId}`);
  }
  for (const key of SECTION_SPACING_KEYS) if (sections.style?.[key]) add(sections.style[key], 'sections');
  for (const [file, source] of Object.entries(files)) {
    for (const [, name] of source.matchAll(SPACE_REF)) add(name, file.replace(/^.*\/src\//, ''));
  }
  return uses;
}

// Throws if any used token is missing from the new token list.
export function assertSpacingKept(tokens, uses) {
  const names = new Set(tokens.map((t) => t.name));
  const missing = Object.keys(uses).filter((name) => !names.has(name));
  if (missing.length) {
    const detail = missing.map((name) => `"${name}" (used by ${uses[name].join(', ')})`).join('; ');
    throw new Error(`Spacing still in use: ${detail}`);
  }
}
