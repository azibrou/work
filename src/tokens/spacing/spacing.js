// Helpers for components that pick a spacing token (cards, sections). Settings store the
// token name ("16"); the page uses the CSS variable, so editing a token's value in
// Tokens/Spacing updates every place that uses it.
import spacing from './spacing.json';

export const SPACING_TOKENS = spacing.tokens;
export const SPACING_NAMES = SPACING_TOKENS.map((t) => t.name);

export const spaceVar = (name) => `var(--space-${name})`;
export const spaceValue = (name) => SPACING_TOKENS.find((t) => t.name === name)?.value ?? 0;

export const spacingLabel = (t) => (t.name === String(t.value) ? `${t.value}px` : `${t.name} (${t.value}px)`);
export const SPACING_OPTIONS = SPACING_TOKENS.map((t) => ({ value: t.name, label: spacingLabel(t) }));

// Throws unless `value` is the name of an existing spacing token.
export function spacingToken(value, label) {
  if (!SPACING_NAMES.includes(value)) throw new Error(`${label} must be one of the spacing tokens`);
  return value;
}
