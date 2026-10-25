import { describe, expect, it } from 'vitest';
import saved from '../src/components/sections/sections.json';
import { nextSectionId, validateSections, MAX_PROJECTS } from '../src/components/sections/sectionsSchema.js';

const section = (overrides = {}) => ({
  id: 'section-1',
  visible: true,
  headlineVisible: true,
  headline: 'Headline',
  projects: [{ title: 'Title', description: 'Description' }],
  ...overrides,
});
const make = (sections, style = saved.style) => ({ style, sections });

describe('validateSections', () => {
  it('accepts the saved sections unchanged', () => {
    expect(validateSections(saved)).toEqual(saved);
  });

  it('allows no sections at all', () => {
    expect(validateSections(make([])).sections).toEqual([]);
  });

  it('keeps a hidden headline, even when empty', () => {
    expect(validateSections(make([section({ headlineVisible: false, headline: '' })])).sections[0].headline).toBe('');
  });

  it('drops unknown keys', () => {
    const result = validateSections({ ...make([{ ...section(), extra: 1 }]), other: 2 });
    expect(result).not.toHaveProperty('other');
    expect(result.sections[0]).not.toHaveProperty('extra');
  });

  it.each([
    ['empty shown headline', [section({ headline: ' ' })]],
    ['no projects', [section({ projects: [] })]],
    ['too many projects', [section({ projects: Array(MAX_PROJECTS + 1).fill({ title: 'T', description: 'D' }) })]],
    ['empty project title', [section({ projects: [{ title: '', description: 'D' }] })]],
    ['bad id', [section({ id: 'Section 1' })]],
    ['duplicate ids', [section(), section()]],
    ['missing visible flag', [section({ visible: undefined })]],
  ])('rejects %s', (_, sections) => {
    expect(() => validateSections(make(sections))).toThrow();
  });

  it.each([
    ['headlineSize', 'h9'],
    ['descriptionSize', 'xl'],
    ['titleColor', '#000000'],
    ['paddingTop', '7'],
    ['projectGap', 32],
  ])('rejects style %s = %s', (key, value) => {
    expect(() => validateSections(make([section()], { ...saved.style, [key]: value }))).toThrow();
  });
});

describe('nextSectionId', () => {
  it('skips ids in use', () => {
    expect(nextSectionId([])).toBe('section-1');
    expect(nextSectionId([{ id: 'section-2' }])).toBe('section-3');
    expect(nextSectionId([{ id: 'a' }, { id: 'section-3' }])).toBe('section-4');
  });
});
