import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { categories, EASINGS, generateCss, normalizeHex, toCssValue } from '../src/tokens/generate.js';

const tokensDir = new URL('../src/tokens/', import.meta.url);
const read = (file) => readFileSync(new URL(file, tokensDir), 'utf8').replace(/\r\n/g, '\n');

describe('normalizeHex', () => {
  it.each([
    ['#ABCDEF', '#abcdef'],
    ['abcdef', '#abcdef'],
    ['  #FFF ', '#ffffff'],
    ['a1b', '#aa11bb'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeHex(input)).toBe(expected);
  });

  it.each(['', '#12', '#12345', '#1234567', '#ggg', 'red'])('rejects "%s"', (input) => {
    expect(normalizeHex(input)).toBeNull();
  });
});

describe('toCssValue', () => {
  it('returns the hex when there is no opacity', () => {
    expect(toCssValue({ hex: '#ff0000' })).toBe('#ff0000');
  });

  it('converts hex and opacity to rgba', () => {
    expect(toCssValue({ hex: '#ff8000', opacity: 50 })).toBe('rgba(255, 128, 0, 0.5)');
  });

  it('handles 0 and 100 opacity', () => {
    expect(toCssValue({ hex: '#000000', opacity: 0 })).toBe('rgba(0, 0, 0, 0)');
    expect(toCssValue({ hex: '#000000', opacity: 100 })).toBe('rgba(0, 0, 0, 1)');
  });
});

describe('generateCss', () => {
  it('throws on an unknown category', () => {
    expect(() => generateCss('spacing', {})).toThrow('Unknown category');
    expect(() => generateCss('toString', {})).toThrow('Unknown category');
  });

  describe('animation', () => {
    const make = (token) => ({ tokens: { quick: { label: 'Quick', duration: 100, easing: 'ease-out', ...token } } });

    it('emits duration and easing variables', () => {
      expect(generateCss('animation', make({ easing: 'linear' }))).toBe(
        ':root {\n  --duration-quick: 100ms;\n  --easing-quick: linear;\n}\n',
      );
    });

    it('maps every named easing', () => {
      for (const [name, value] of Object.entries(EASINGS)) {
        expect(generateCss('animation', make({ easing: name }))).toContain(`--easing-quick: ${value};`);
      }
    });

    it.each([-1, 10001, 1.5, '100', NaN])('rejects duration %s', (duration) => {
      expect(() => generateCss('animation', make({ duration }))).toThrow('duration');
    });

    it('rejects unknown easings, including prototype keys', () => {
      expect(() => generateCss('animation', make({ easing: 'bounce' }))).toThrow('unknown easing');
      expect(() => generateCss('animation', make({ easing: 'toString' }))).toThrow('unknown easing');
    });

    it('rejects invalid token keys', () => {
      expect(() => generateCss('animation', { tokens: { 'Bad Key': { duration: 1, easing: 'linear' } } })).toThrow(
        'Invalid animation token',
      );
    });
  });

  describe('typography', () => {
    const make = (overrides = {}) => ({
      weights: { regular: 400, bold: 700 },
      headings: { h1: { fontSize: 48, lineHeight: 56, fontWeight: 700 } },
      body: { large: { fontSize: 18, lineHeight: 28 } },
      ...overrides,
    });

    it('emits font, heading, body and weight variables', () => {
      const css = generateCss('typography', make());
      expect(css).toContain("@import url('https://fonts.googleapis.com/css2?family=Inter");
      expect(css).toContain('--font-size-h1: 48px;');
      expect(css).toContain('--line-height-h1: 56px;');
      expect(css).toContain('--font-weight-h1: 700;');
      expect(css).toContain('--font-size-body-large: 18px;');
      expect(css).toContain('--font-weight-regular: 400;');
      expect(css).toContain('--font-weight-bold: 700;');
    });

    it('rejects out-of-range weights', () => {
      expect(() => generateCss('typography', make({ weights: { regular: 50, bold: 700 } }))).toThrow('Weights');
      expect(() => generateCss('typography', make({ weights: { regular: 400, bold: 1000 } }))).toThrow('Weights');
    });

    it('rejects bad sizes, line heights and heading weights', () => {
      const heading = (t) => make({ headings: { h1: { fontWeight: 700, fontSize: 48, lineHeight: 56, ...t } } });
      expect(() => generateCss('typography', heading({ fontSize: 0 }))).toThrow('font size');
      expect(() => generateCss('typography', heading({ lineHeight: 301 }))).toThrow('line height');
      expect(() => generateCss('typography', heading({ fontWeight: 99 }))).toThrow('weight');
    });

    it('rejects invalid style names', () => {
      expect(() => generateCss('typography', make({ body: { 'Bad Name': { fontSize: 10, lineHeight: 12 } } }))).toThrow(
        'Invalid style',
      );
    });
  });

  describe('color', () => {
    const token = (overrides) => ({ cssVar: '--color-text', hex: '#242320', ...overrides });
    const make = (overrides) => ({ groups: [{ tokens: [token(overrides)] }] });

    it('emits hex colors', () => {
      expect(generateCss('color', make())).toBe(':root {\n  --color-text: #242320;\n}\n');
    });

    it('emits rgba when opacity is set', () => {
      expect(generateCss('color', make({ hex: '#ffffff', opacity: 10 }))).toContain(
        '--color-text: rgba(255, 255, 255, 0.1);',
      );
    });

    it('separates groups with a blank line', () => {
      const data = { groups: [{ tokens: [token()] }, { tokens: [token({ cssVar: '--color-link' })] }] };
      expect(generateCss('color', data)).toContain('#242320;\n\n  --color-link');
    });

    it('rejects bad css variable names, hex values and opacity', () => {
      expect(() => generateCss('color', make({ cssVar: 'color-text' }))).toThrow('Invalid color variable');
      expect(() => generateCss('color', make({ hex: '#FFF' }))).toThrow('invalid hex');
      expect(() => generateCss('color', make({ opacity: 101 }))).toThrow('opacity');
      expect(() => generateCss('color', make({ opacity: 0.5 }))).toThrow('opacity');
    });
  });
});

// Guards against editing a JSON token file (or the generator) without regenerating the CSS.
describe.each(Object.entries(categories))('committed %s tokens', (category, { json, css }) => {
  it('generate the committed CSS file', () => {
    expect(generateCss(category, JSON.parse(read(json)))).toBe(read(css));
  });
});
