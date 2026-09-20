// Shared by the Storybook editors (browser) and the save endpoint (node): validates token
// data and generates the CSS custom-property files. Keep this file free of node/browser APIs.

export const EASINGS = {
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  linear: 'linear',
};

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif:wght@400;500;600;700&family=Bricolage+Grotesque:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;600;700&display=swap');";
const FONT_FAMILY = "'Inter', sans-serif";
const FONT_FAMILY_SERIF = "'Noto Serif', serif";
const FONT_FAMILY_BRICOLAGE = "'Bricolage Grotesque', sans-serif";
const FONT_FAMILY_MONO = "'Roboto Mono', monospace";

export function normalizeHex(input) {
  const value = input.trim().replace(/^#?/, '#').toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(value)) return value;
  if (/^#[0-9a-f]{3}$/.test(value)) {
    return '#' + value.slice(1).split('').map((c) => c + c).join('');
  }
  return null;
}

export function toCssValue({ hex, opacity }) {
  if (opacity === undefined) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${+(opacity / 100).toFixed(3)})`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const inRange = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const KEY = /^[a-z0-9]+$/;

function animationCss(data) {
  const blocks = Object.entries(data.tokens).map(([key, t]) => {
    assert(KEY.test(key), `Invalid animation token "${key}"`);
    assert(inRange(t.duration, 0, 10000), `${key}: duration must be a whole number of ms (0-10000)`);
    assert(Object.hasOwn(EASINGS, t.easing), `${key}: unknown easing "${t.easing}"`);
    return `  --duration-${key}: ${t.duration}ms;\n  --easing-${key}: ${EASINGS[t.easing]};`;
  });
  return `:root {\n${blocks.join('\n\n')}\n}\n`;
}

function typographyCss(data) {
  const { weights, headings, body } = data;
  assert(inRange(weights.regular, 100, 900) && inRange(weights.bold, 100, 900), 'Weights must be 100-900');

  const size = (name, t) => {
    assert(/^[a-z0-9-]+$/.test(name), `Invalid style "${name}"`);
    assert(inRange(t.fontSize, 1, 200), `${name}: font size must be 1-200`);
    assert(inRange(t.lineHeight, 1, 300), `${name}: line height must be 1-300`);
    return `  --font-size-${name}: ${t.fontSize}px;\n  --line-height-${name}: ${t.lineHeight}px;`;
  };

  const headingLines = Object.entries(headings).map(([key, t]) => {
    assert(inRange(t.fontWeight, 100, 900), `${key}: weight must be 100-900`);
    return `${size(key, t)}\n  --font-weight-${key}: ${t.fontWeight};`;
  });
  const bodyLines = Object.entries(body).map(([key, t]) => size(`body-${key}`, t));

  return [
    FONT_IMPORT,
    '',
    ':root {',
    `  --font-family-base: ${FONT_FAMILY};`,
    `  --font-family-serif: ${FONT_FAMILY_SERIF};`,
    `  --font-family-bricolage: ${FONT_FAMILY_BRICOLAGE};`,
    `  --font-family-mono: ${FONT_FAMILY_MONO};`,
    '',
    headingLines.join('\n\n'),
    '',
    bodyLines.join('\n\n'),
    '',
    `  --font-weight-regular: ${weights.regular};`,
    `  --font-weight-bold: ${weights.bold};`,
    '}',
    '',
  ].join('\n');
}

function colorCss(data) {
  const blocks = data.groups.map((group) =>
    group.tokens
      .map((t) => {
        assert(/^--color-[a-z0-9-]+$/.test(t.cssVar), `Invalid color variable "${t.cssVar}"`);
        assert(normalizeHex(t.hex) === t.hex, `${t.cssVar}: invalid hex "${t.hex}"`);
        assert(t.opacity === undefined || inRange(t.opacity, 0, 100), `${t.cssVar}: opacity must be 0-100`);
        return `  ${t.cssVar}: ${toCssValue(t)};`;
      })
      .join('\n'),
  );
  return `:root {\n${blocks.join('\n\n')}\n}\n`;
}

export const categories = {
  animation: { json: 'animation/animation.json', css: 'animation/animation.css', toCss: animationCss },
  typography: { json: 'typography/typography.json', css: 'typography/typography.css', toCss: typographyCss },
  color: { json: 'color/color.json', css: 'color/colors.css', toCss: colorCss },
};

export function generateCss(category, data) {
  assert(Object.hasOwn(categories, category), `Unknown category "${category}"`);
  return categories[category].toCss(data);
}
