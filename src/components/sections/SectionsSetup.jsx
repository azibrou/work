import sectionsData from './sections.json';
import ProjectSections from './ProjectSections.jsx';
import ApplyBar from '../../tokens/ApplyBar.jsx';
import { postJson, useApplyEditor } from '../../tokens/useTokenEditor.js';
import { useApplyCheck } from '../../tokens/useApplyCheck.js';
import {
  validateSections,
  nextSectionId,
  MAX_SECTIONS,
  MAX_PROJECTS,
  FONT_OPTIONS,
  HEADLINE_SIZES,
  DESCRIPTION_SIZES,
  TEXT_WEIGHTS,
  TEXT_COLOR_OPTIONS,
} from './sectionsSchema.js';
import { CheckboxField, Row, Section, SelectField, SpacingField, TextAreaField, TextField } from '../home-cards/setupFields.jsx';

const HEADING_OPTIONS = HEADLINE_SIZES.map((v) => ({ value: v, label: v === 'memo' ? 'Memo' : v.toUpperCase() }));
const BODY_OPTIONS = DESCRIPTION_SIZES.map((v) => ({ value: v, label: `Body ${v.toUpperCase()}` }));
const WEIGHT_OPTIONS = TEXT_WEIGHTS.map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));

const NEW_PROJECT = { title: 'Project title', description: 'Short description of the project.' };

const smallButton = {
  padding: '6px 10px',
  font: '600 13px Inter, sans-serif',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
};

function SmallButton({ children, disabled, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{ ...smallButton, opacity: disabled ? 0.35 : 1, cursor: disabled ? 'default' : 'pointer' }}
    >
      {children}
    </button>
  );
}

function SectionEditor({ section, index, count, onChange, onMove, onRemove }) {
  const set = (key) => (value) => onChange({ ...section, [key]: value });
  const setProjects = (update) => onChange({ ...section, projects: update(section.projects) });
  const n = index + 1;

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <strong style={{ fontSize: 14, flex: 1 }}>Section {n}</strong>
        <SmallButton label={`Move section ${n} up`} disabled={index === 0} onClick={() => onMove(-1)}>
          ↑
        </SmallButton>
        <SmallButton label={`Move section ${n} down`} disabled={index === count - 1} onClick={() => onMove(1)}>
          ↓
        </SmallButton>
        <SmallButton label={`Remove section ${n}`} onClick={onRemove}>
          Remove
        </SmallButton>
      </div>
      <CheckboxField label="Show section on the home page" checked={section.visible} onChange={set('visible')} />

      {section.headlineVisible ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          <TextField label="Headline" value={section.headline} onChange={set('headline')} />
          <SmallButton label="Remove headline" onClick={() => set('headlineVisible')(false)}>
            ✕
          </SmallButton>
        </div>
      ) : (
        <div>
          <SmallButton
            label="Add headline"
            onClick={() => onChange({ ...section, headlineVisible: true, headline: section.headline || 'Section headline' })}
          >
            + Add headline
          </SmallButton>
        </div>
      )}

      {section.projects.map((project, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 12, borderLeft: '2px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <TextField
              label={`Project ${i + 1} title`}
              value={project.title}
              onChange={(title) => setProjects((list) => list.map((p, j) => (j === i ? { ...p, title } : p)))}
            />
            <SmallButton
              label={`Remove project ${i + 1}`}
              disabled={section.projects.length === 1}
              onClick={() => setProjects((list) => list.filter((_, j) => j !== i))}
            >
              ✕
            </SmallButton>
          </div>
          <TextAreaField
            label="Description"
            value={project.description}
            onChange={(description) => setProjects((list) => list.map((p, j) => (j === i ? { ...p, description } : p)))}
          />
        </div>
      ))}
      <div>
        <SmallButton
          label="Add project"
          disabled={section.projects.length >= MAX_PROJECTS}
          onClick={() => setProjects((list) => [...list, { ...NEW_PROJECT }])}
        >
          + Add project
        </SmallButton>
      </div>
    </div>
  );
}

export default function SectionsSetup() {
  const { data, setData, dirty, apply, reset, status } = useApplyEditor(sectionsData, async (current) => {
    const result = await postJson('/__sections/save', { sections: current });
    return { data: result.sections };
  });
  const check = useApplyCheck(validateSections, data);
  const setStyle = (key) => (value) => setData((prev) => ({ ...prev, style: { ...prev.style, [key]: value } }));
  const setSections = (update) => setData((prev) => ({ ...prev, sections: update(prev.sections) }));
  const { style, sections } = data;

  const addSection = () =>
    setSections((list) => [
      ...list,
      { id: nextSectionId(list), visible: true, headlineVisible: true, headline: 'Section headline', projects: [{ ...NEW_PROJECT }] },
    ]);
  const move = (index, step) =>
    setSections((list) => {
      const next = [...list];
      [next[index], next[index + step]] = [next[index + step], next[index]];
      return next;
    });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#111827' }}>
      <ApplyBar dirty={dirty} status={status} onApply={apply} onReset={reset} check={check} />
      <div style={{ display: 'grid', gridTemplateColumns: '400px minmax(0, 1fr)', gap: 32, alignItems: 'start' }}>
        <div>
          <Section title={`Sections (${sections.length}/${MAX_SECTIONS})`}>
            {sections.map((section, index) => (
              <SectionEditor
                key={section.id}
                section={section}
                index={index}
                count={sections.length}
                onChange={(next) => setSections((list) => list.map((s, i) => (i === index ? next : s)))}
                onMove={(step) => move(index, step)}
                onRemove={() => setSections((list) => list.filter((_, i) => i !== index))}
              />
            ))}
            <div>
              <SmallButton label="Add section" disabled={sections.length >= MAX_SECTIONS} onClick={addSection}>
                + Add section
              </SmallButton>
            </div>
          </Section>

          <Section title="Headline style">
            <Row>
              <SelectField label="Font" value={style.headlineFont} onChange={setStyle('headlineFont')} options={FONT_OPTIONS} />
              <SelectField label="Size" value={style.headlineSize} onChange={setStyle('headlineSize')} options={HEADING_OPTIONS} />
              <SelectField label="Color" value={style.headlineColor} onChange={setStyle('headlineColor')} options={TEXT_COLOR_OPTIONS} />
            </Row>
          </Section>
          <Section title="Project title style">
            <Row>
              <SelectField label="Font" value={style.titleFont} onChange={setStyle('titleFont')} options={FONT_OPTIONS} />
              <SelectField label="Size" value={style.titleSize} onChange={setStyle('titleSize')} options={HEADING_OPTIONS} />
              <SelectField label="Color" value={style.titleColor} onChange={setStyle('titleColor')} options={TEXT_COLOR_OPTIONS} />
            </Row>
          </Section>
          <Section title="Description style">
            <Row>
              <SelectField label="Font" value={style.descriptionFont} onChange={setStyle('descriptionFont')} options={FONT_OPTIONS} />
              <SelectField label="Size" value={style.descriptionSize} onChange={setStyle('descriptionSize')} options={BODY_OPTIONS} />
              <SelectField label="Weight" value={style.descriptionWeight} onChange={setStyle('descriptionWeight')} options={WEIGHT_OPTIONS} />
              <SelectField label="Color" value={style.descriptionColor} onChange={setStyle('descriptionColor')} options={TEXT_COLOR_OPTIONS} />
            </Row>
          </Section>
          <Section title="Spacing">
            <Row>
              <SpacingField label="Padding top" value={style.paddingTop} onChange={setStyle('paddingTop')} />
              <SpacingField label="Padding bottom" value={style.paddingBottom} onChange={setStyle('paddingBottom')} />
            </Row>
            <Row>
              <SpacingField label="Below headline" value={style.headlineGap} onChange={setStyle('headlineGap')} />
              <SpacingField label="Between projects" value={style.projectGap} onChange={setStyle('projectGap')} />
              <SpacingField label="Below project title" value={style.titleGap} onChange={setStyle('titleGap')} />
            </Row>
          </Section>
          <p style={{ fontSize: 12, color: '#6b7280' }}>
            Styles apply to every section. Sizes come from Tokens/Typography, colors from Tokens/Color and spacing from
            Tokens/Spacing. On the page, headlines stay H2 and project titles H3 whatever size they show at.
          </p>
        </div>
        <div style={{ position: 'sticky', top: 64 }}>
          <div style={{ padding: '12px 0', fontSize: 13, color: '#6b7280' }}>Preview (shown below the tiles on the home page)</div>
          <div style={{ border: '1px dashed #e5e7eb', borderRadius: 8, padding: '0 24px', maxHeight: 'calc(100vh - 140px)', overflow: 'auto' }}>
            {sections.some((s) => s.visible) ? (
              <ProjectSections style={style} sections={sections} />
            ) : (
              <p style={{ padding: 24, fontSize: 13, color: '#6b7280' }}>No sections are shown.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
