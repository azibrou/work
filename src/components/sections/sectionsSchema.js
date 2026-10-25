// Shared by the sections setup page (browser) and the save endpoint (node). Keep free of node/browser APIs.
import { FONT_FAMILIES, FONT_OPTIONS, FONT_VARS, DESCRIPTION_SIZES, TEXT_WEIGHTS } from '../home-cards/cardSchema.js';
import { HEADLINE_SIZES, TEXT_COLOR_OPTIONS, TEXT_COLOR_TOKENS } from '../memo/memoSchema.js';
import { spacingToken } from '../../tokens/spacing/spacing.js';

export { FONT_OPTIONS, FONT_VARS, HEADLINE_SIZES, DESCRIPTION_SIZES, TEXT_WEIGHTS, TEXT_COLOR_OPTIONS };

export const MAX_SECTIONS = 20;
export const MAX_PROJECTS = 20;

// Style settings that hold a spacing token name (see Tokens/Spacing).
export const SECTION_SPACING_KEYS = ['paddingTop', 'paddingBottom', 'headlineGap', 'projectGap', 'titleGap'];

const TEXT_COLORS = TEXT_COLOR_TOKENS.map((t) => t.cssVar);

function fail(message) {
  throw new Error(message);
}

const text = (value, name, max) =>
  typeof value === 'string' && value.trim() && value.length <= max ? value : fail(`${name} must be text up to ${max} characters`);
const oneOf = (value, options, name) => (options.includes(value) ? value : fail(`${name} has an invalid value`));
const bool = (value, name) => (typeof value === 'boolean' ? value : fail(`${name} must be true or false`));
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateStyle(s = {}) {
  return {
    headlineFont: oneOf(s.headlineFont, FONT_FAMILIES, 'Headline font'),
    headlineSize: oneOf(s.headlineSize, HEADLINE_SIZES, 'Headline size'),
    headlineColor: oneOf(s.headlineColor, TEXT_COLORS, 'Headline color'),
    titleFont: oneOf(s.titleFont, FONT_FAMILIES, 'Project title font'),
    titleSize: oneOf(s.titleSize, HEADLINE_SIZES, 'Project title size'),
    titleColor: oneOf(s.titleColor, TEXT_COLORS, 'Project title color'),
    descriptionFont: oneOf(s.descriptionFont, FONT_FAMILIES, 'Description font'),
    descriptionSize: oneOf(s.descriptionSize, DESCRIPTION_SIZES, 'Description size'),
    descriptionWeight: oneOf(s.descriptionWeight, TEXT_WEIGHTS, 'Description weight'),
    descriptionColor: oneOf(s.descriptionColor, TEXT_COLORS, 'Description color'),
    paddingTop: spacingToken(s.paddingTop, 'Padding top'),
    paddingBottom: spacingToken(s.paddingBottom, 'Padding bottom'),
    headlineGap: spacingToken(s.headlineGap, 'Gap below headline'),
    projectGap: spacingToken(s.projectGap, 'Gap between projects'),
    titleGap: spacingToken(s.titleGap, 'Gap below project title'),
  };
}

export function validateSections(data) {
  const list = Array.isArray(data?.sections) ? data.sections : fail('Sections must be a list');
  if (list.length > MAX_SECTIONS) fail(`Up to ${MAX_SECTIONS} sections`);
  const ids = new Set();

  return {
    style: validateStyle(data.style),
    sections: list.map((s, i) => {
      const n = `Section ${i + 1}`;
      const id = typeof s?.id === 'string' && ID.test(s.id) ? s.id : fail(`${n} has an invalid id`);
      if (ids.has(id)) fail(`Two sections share the id "${id}"`);
      ids.add(id);
      const headlineVisible = bool(s.headlineVisible, `${n}: Show headline`);
      const projects = Array.isArray(s.projects) ? s.projects : fail(`${n} needs a list of projects`);
      if (projects.length < 1 || projects.length > MAX_PROJECTS) fail(`${n} needs 1-${MAX_PROJECTS} projects`);

      return {
        id,
        visible: bool(s.visible, `${n}: Show section`),
        headlineVisible,
        // A hidden headline keeps its text so it can be shown again later.
        headline: headlineVisible ? text(s.headline, `${n} headline`, 200) : typeof s.headline === 'string' ? s.headline.slice(0, 200) : '',
        projects: projects.map((p, j) => ({
          title: text(p?.title, `${n}, project ${j + 1} title`, 200),
          description: text(p.description, `${n}, project ${j + 1} description`, 1200),
        })),
      };
    }),
  };
}

// The id for a new section: "section-1", "section-2", ... skipping ones in use.
export function nextSectionId(sections) {
  const taken = new Set(sections.map((s) => s.id));
  let n = sections.length + 1;
  while (taken.has(`section-${n}`)) n += 1;
  return `section-${n}`;
}
