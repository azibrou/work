// Shared by the card setup pages (browser) and the save endpoint (node): option lists,
// validation of a card's config, and the background helper. Keep free of node/browser APIs.
import { normalizeHex } from '../../tokens/generate.js';

export const FONT_FAMILIES = ['inter', 'noto-serif', 'bricolage-grotesque', 'roboto-mono'];
export const HEADLINE_TYPES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
export const DESCRIPTION_SIZES = ['s', 'm', 'l'];
export const TEXT_POSITIONS = ['top', 'center', 'bottom'];
export const TEXT_ALIGNS = ['left', 'center', 'right'];
export const TEXT_COLORS = ['dark', 'light'];
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

export function validateCard(c) {
  const logo = c.logo ?? null;
  if (logo !== null && !LOGO_FILE.test(logo)) fail('logo has an invalid file name');

  return {
    fontFamily: oneOf(c.fontFamily, FONT_FAMILIES, 'Font'),
    title: text(c.title, 'Headline'),
    headlineType: oneOf(c.headlineType, HEADLINE_TYPES, 'Headline type'),
    description: text(c.description, 'Description'),
    descriptionSize: oneOf(c.descriptionSize, DESCRIPTION_SIZES, 'Description size'),
    textColor: oneOf(c.textColor, TEXT_COLORS, 'Text color'),
    logo,
    logoSize: int(c.logoSize, 8, 400, 'Logo size'),
    width: int(c.width, 100, 3000, 'Width'),
    height: int(c.height, 100, 3000, 'Height'),
    textPosition: oneOf(c.textPosition, TEXT_POSITIONS, 'Text position'),
    textAlign: oneOf(c.textAlign, TEXT_ALIGNS, 'Text alignment'),
    textWidth: int(c.textWidth, 50, 3000, 'Text block width'),
    padding: int(c.padding, 0, 500, 'Padding'),
    radius: int(c.radius, 0, 500, 'Radius'),
    hoverRadius: int(c.hoverRadius, 0, 500, 'Hover radius'),
    buttonRadius: int(c.buttonRadius, 0, 500, 'Button radius'),
    buttonHoverRadius: int(c.buttonHoverRadius, 0, 50, 'Button hover radius'),
    buttonOpacity: int(c.buttonOpacity, 0, 100, 'Button opacity'),
    background: color(c.background, 'Background'),
    backgroundEnd: color(c.backgroundEnd, 'Background end'),
    hoverBackground: color(c.hoverBackground, 'Hover background'),
    hoverBackgroundEnd: color(c.hoverBackgroundEnd, 'Hover background end'),
    gradientAngle: int(c.gradientAngle, 0, 360, 'Gradient angle'),
  };
}
