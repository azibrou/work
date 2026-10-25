import { describe, expect, it } from 'vitest';
import { generateCss } from '../src/tokens/generate.js';
import spacing from '../src/tokens/spacing/spacing.json';
import cards from '../src/components/home-cards/cards.json';
import sections from '../src/components/sections/sections.json';
import { spacingToken, spaceValue, spaceVar } from '../src/tokens/spacing/spacing.js';
import { assertSpacingKept, findSpacingUses } from '../src/tokens/spacing/usage.js';
import { validateCard } from '../src/components/home-cards/cardSchema.js';

describe('spacing tokens', () => {
  // Tokens can be added in Tokens/Spacing, so this checks the base scale is still there.
  it('include the base scale', () => {
    expect(spacing.tokens.map((t) => t.value)).toEqual(expect.arrayContaining([2, 4, 8, 12, 16, 18, 20, 24, 28, 32, 40, 56, 64]));
  });

  it('emit one variable per token', () => {
    expect(generateCss('spacing', { tokens: [{ name: '8', value: 8 }, { name: 'xl', value: 48 }] })).toBe(
      ':root {\n  --space-8: 8px;\n  --space-xl: 48px;\n}\n',
    );
  });

  it.each([
    ['an empty list', { tokens: [] }],
    ['a bad name', { tokens: [{ name: 'Big One', value: 1 }] }],
    ['a duplicate name', { tokens: [{ name: '8', value: 8 }, { name: '8', value: 9 }] }],
    ['a negative value', { tokens: [{ name: '8', value: -1 }] }],
    ['a fractional value', { tokens: [{ name: '8', value: 1.5 }] }],
  ])('reject %s', (_, data) => {
    expect(() => generateCss('spacing', data)).toThrow();
  });

  it('resolve names to variables and values', () => {
    expect(spaceVar('16')).toBe('var(--space-16)');
    expect(spaceValue('56')).toBe(56);
    expect(spacingToken('8', 'Gap')).toBe('8');
    expect(() => spacingToken('7', 'Gap')).toThrow('Gap');
    expect(() => spacingToken(8, 'Gap')).toThrow();
  });
});

describe('spacing usage', () => {
  const uses = findSpacingUses({
    cards: { a: { padding: '56', hoverPadding: '56', logoGap: '16', textGap: '8', buttonGap: '24' } },
    sections: { style: { paddingTop: '64' } },
    files: { '/x/src/main.css': 'gap: var(--space-12); margin: var(--space-2)' },
  });

  it('collects cards, sections and stylesheet references', () => {
    expect(uses['56']).toEqual(['card a']);
    expect(uses['64']).toEqual(['sections']);
    expect(uses['12']).toEqual(['main.css']);
  });

  it('blocks removing a token in use and allows the rest', () => {
    const without = (name) => spacing.tokens.filter((t) => t.name !== name);
    expect(() => assertSpacingKept(without('12'), uses)).toThrow('"12" (used by main.css)');
    expect(() => assertSpacingKept(without('18'), uses)).not.toThrow();
  });

  it('finds every token the saved project uses in the token list', () => {
    expect(() => assertSpacingKept(spacing.tokens, findSpacingUses({ cards, sections }))).not.toThrow();
  });
});

describe('cards with spacing tokens', () => {
  // toMatchObject: configs saved before newer settings get those filled in with defaults.
  it.each(Object.entries(cards))('%s keeps its saved settings', (_, card) => {
    expect(validateCard(card)).toMatchObject(card);
  });

  it('keeps custom button text and defaults it for older configs', () => {
    expect(validateCard({ ...cards.mgh, buttonLabel: 'Read more' }).buttonLabel).toBe('Read more');
    const { buttonLabel: _dropped, ...old } = cards.mgh;
    expect(validateCard(old).buttonLabel).toBe('View case study');
  });

  it.each(['', '   ', 'x'.repeat(41), 5])('rejects button text %s', (buttonLabel) => {
    expect(() => validateCard({ ...cards.mgh, buttonLabel })).toThrow('Button text');
  });

  it('rejects a pixel number instead of a token', () => {
    expect(() => validateCard({ ...cards.mgh, padding: 56 })).toThrow('Padding');
  });
});
