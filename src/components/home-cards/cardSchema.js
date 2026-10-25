// Shared by the card setup pages (browser) and the save endpoint (node): option lists,
// validation of a card's config, and the background helper. Keep free of node/browser APIs.
import { normalizeHex } from '../../tokens/generate.js';
import { spacingToken } from '../../tokens/spacing/spacing.js';

// Settings that hold a spacing token name (see Tokens/Spacing).
export const CARD_SPACING_KEYS = ['padding', 'hoverPadding', 'logoGap', 'textGap', 'buttonGap'];

// The one list of selectable fonts. Each maps to a CSS variable from typography.css.
export const FONTS = {
  inter: { label: 'Inter', css: 'var(--font-family-base)' },
  'noto-serif': { label: 'Noto Serif', css: 'var(--font-family-serif)' },
  'bricolage-grotesque': { label: 'Bricolage Grotesque', css: 'var(--font-family-bricolage)' },
  'roboto-mono': { label: 'Roboto Mono', css: 'var(--font-family-mono)' },
  'google-sans': { label: 'Google Sans', css: 'var(--font-family-google-sans)' },
};
export const FONT_FAMILIES = Object.keys(FONTS);
export const FONT_OPTIONS = FONT_FAMILIES.map((value) => ({ value, label: FONTS[value].label }));
export const FONT_VARS = Object.fromEntries(FONT_FAMILIES.map((key) => [key, FONTS[key].css]));
export const HEADLINE_TYPES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
export const DESCRIPTION_SIZES = ['s', 'm', 'l'];
export const TEXT_WEIGHTS = ['regular', 'semibold', 'bold'];
export const TEXT_POSITIONS = ['top', 'center', 'bottom'];
export const TEXT_ALIGNS = ['left', 'center', 'right'];
export const TEXT_COLORS = ['dark', 'light'];
// `percent` is a share of the width inside the card's padding.
export const TEXT_WIDTH_UNITS = ['px', 'percent'];
export const LOGO_FILE = /^[a-z0-9-]+\.(svg|png|jpe?g|webp)$/;

export function toBackground(start, end, angle) {
  return start === end ? start : `linear-gradient(${angle}deg, ${start}, ${end})`;
}

function fail(message) {
  throw new Error(message);
}

const text = (value, name) => {
  if (typeof value !== 'string' || value.length > 600) fail(`${name} must be text up to 600 characters`);
  return value;
};
const oneOf = (value, options, name) => (options.includes(value) ? value : fail(`${name} has an invalid value`));
const int = (value, min, max, name) =>
  Number.isInteger(value) && value >= min && value <= max ? value : fail(`${name} must be a whole number ${min}-${max}`);
const color = (value, name) => (typeof value === 'string' && normalizeHex(value) === value ? value : fail(`${name} must be a hex color`));

export const MAX_BUTTON_LABEL = 40;
const buttonLabel = (value) =>
  typeof value === 'string' && value.trim() && value.length <= MAX_BUTTON_LABEL
    ? value
    : fail(`Button text must be text up to ${MAX_BUTTON_LABEL} characters`);

// What screen readers say for the logo; empty means decorative.
const logoAlt = (value) =>
  typeof value === 'string' && value.length <= 120 ? value.trim() : fail('Logo description must be text up to 120 characters');

export function validateCard(c) {
  const logo = c.logo ?? null;
  // Older saved configs predate the setting; a missing value means shown.
  const headlineVisible = c.headlineVisible ?? true;
  if (logo !== null && !LOGO_FILE.test(logo)) fail('logo has an invalid file name');

  return {
    visible: typeof c.visible === 'boolean' ? c.visible : fail('Visible must be true or false'),
    fontFamily: oneOf(c.fontFamily, FONT_FAMILIES, 'Font'),
    headlineVisible: typeof headlineVisible === 'boolean' ? headlineVisible : fail('Show headline must be true or false'),
    title: text(c.title, 'Headline'),
    headlineType: oneOf(c.headlineType, HEADLINE_TYPES, 'Headline type'),
    description: text(c.description, 'Description'),
    descriptionSize: oneOf(c.descriptionSize, DESCRIPTION_SIZES, 'Description text style'),
    // The description and button styles below came after the rest; configs
    // saved before them fall back to Inter and the weights the cards used.
    descriptionFontFamily: oneOf(c.descriptionFontFamily ?? 'inter', FONT_FAMILIES, 'Description font'),
    descriptionWeight: oneOf(c.descriptionWeight ?? 'regular', TEXT_WEIGHTS, 'Description weight'),
    textColor: oneOf(c.textColor, TEXT_COLORS, 'Text color'),
    logo,
    logoAlt: logoAlt(c.logoAlt ?? ''),
    logoSize: int(c.logoSize, 8, 400, 'Logo height'),
    width: int(c.width, 100, 3000, 'Width'),
    height: int(c.height, 100, 3000, 'Height'),
    textPosition: oneOf(c.textPosition, TEXT_POSITIONS, 'Text position'),
    textAlign: oneOf(c.textAlign, TEXT_ALIGNS, 'Text alignment'),
    textWidthUnit: oneOf(c.textWidthUnit ?? 'px', TEXT_WIDTH_UNITS, 'Text block width unit'),
    textWidth:
      (c.textWidthUnit ?? 'px') === 'percent'
        ? int(c.textWidth, 1, 100, 'Text block width')
        : int(c.textWidth, 50, 3000, 'Text block width'),
    padding: spacingToken(c.padding, 'Padding'),
    hoverPadding: spacingToken(c.hoverPadding, 'Hover padding'),
    logoGap: spacingToken(c.logoGap, 'Gap below logo'),
    textGap: spacingToken(c.textGap, 'Gap between headline and description'),
    buttonGap: spacingToken(c.buttonGap, 'Gap above button'),
    radius: int(c.radius, 0, 500, 'Radius'),
    hoverRadius: int(c.hoverRadius, 0, 500, 'Hover radius'),
    buttonRadius: int(c.buttonRadius, 0, 500, 'Button radius'),
    buttonHoverRadius: int(c.buttonHoverRadius, 0, 50, 'Button hover radius'),
    buttonOpacity: int(c.buttonOpacity, 0, 100, 'Button opacity'),
    buttonLabel: buttonLabel(c.buttonLabel ?? 'View case study'),
    buttonFontFamily: oneOf(c.buttonFontFamily ?? 'inter', FONT_FAMILIES, 'Button font'),
    buttonSize: oneOf(c.buttonSize ?? c.descriptionSize, DESCRIPTION_SIZES, 'Button text style'),
    buttonWeight: oneOf(c.buttonWeight ?? 'semibold', TEXT_WEIGHTS, 'Button weight'),
    background: color(c.background, 'Background'),
    backgroundEnd: color(c.backgroundEnd, 'Background end'),
    hoverBackground: color(c.hoverBackground, 'Hover background'),
    hoverBackgroundEnd: color(c.hoverBackgroundEnd, 'Hover background end'),
    gradientAngle: int(c.gradientAngle, 0, 360, 'Gradient angle'),
  };
}
