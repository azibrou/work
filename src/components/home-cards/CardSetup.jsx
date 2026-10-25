import { useState } from 'react';
import cards from './cards.json';
import { postJson, useApplyEditor } from '../../tokens/useTokenEditor.js';
import ApplyBar from '../../tokens/ApplyBar.jsx';
import { useApplyCheck } from '../../tokens/useApplyCheck.js';
import { validateCard } from './cardSchema.js';
import { CheckboxField, ColorField, NumberField, Row, Section, SelectField, SpacingField, TextAreaField, TextField } from './setupFields.jsx';
import { spaceValue } from '../../tokens/spacing/spacing.js';
import { HEADLINE_TYPES, DESCRIPTION_SIZES, TEXT_WEIGHTS, TEXT_WIDTH_UNITS, TEXT_POSITIONS, TEXT_ALIGNS, TEXT_COLORS, FONT_OPTIONS } from './cardSchema.js';

const MAX_LOGO_BYTES = 1.5 * 1024 * 1024;
const LOGO_TYPES = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'];


const TEXT_STYLE_LABELS = { s: 'Body S', m: 'Body M', l: 'Body L' };
const WEIGHT_LABELS = { regular: 'Regular', semibold: 'Semibold', bold: 'Bold' };

const WIDTH_UNIT_LABELS = { px: 'Pixels', percent: '% of available width' };

// Switching unit converts the value against the width inside the padding, so the
// text block keeps its size until the number itself is changed.
function convertTextWidth(data, unit) {
  const available = Math.max(1, data.width - 2 * spaceValue(data.padding));
  if (unit === data.textWidthUnit) return data;
  const textWidth =
    unit === 'percent'
      ? Math.min(100, Math.max(1, Math.round((data.textWidth / available) * 100)))
      : Math.min(3000, Math.max(50, Math.round((data.textWidth / 100) * available)));
  return { ...data, textWidthUnit: unit, textWidth };
}

const options = (values, labels = {}) => values.map((v) => ({ value: v, label: labels[v] ?? v.toUpperCase() }));
const capitalized = Object.fromEntries(
  [...TEXT_POSITIONS, ...TEXT_ALIGNS].map((v) => [v, v[0].toUpperCase() + v.slice(1)]),
);

function LogoField({ data, onUpload, onRemove }) {
  const [error, setError] = useState('');
  const current = data.logoUpload?.name ?? data.logo;

  function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) return setError('Use an SVG, PNG, JPG or WebP image.');
    if (file.size > MAX_LOGO_BYTES) return setError('Image is larger than 1.5 MB.');
    setError('');
    const reader = new FileReader();
    reader.onload = () => onUpload({ name: file.name, dataUrl: reader.result });
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: '#6b7280' }}>Logo</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <label
          style={{
            padding: '6px 12px',
            font: '600 13px Inter, sans-serif',
            border: '1px solid #111827',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Upload logo
          <input type="file" accept={LOGO_TYPES.join(',')} onChange={pick} style={{ display: 'none' }} />
        </label>
        {current && (
          <button
            type="button"
            onClick={onRemove}
            style={{ padding: '6px 12px', font: '13px Inter, sans-serif', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
          >
            Remove
          </button>
        )}
        <span style={{ fontSize: 12, color: '#6b7280' }}>{current ?? 'No logo'}</span>
      </div>
      {error && <span style={{ fontSize: 12, color: '#dc2626' }}>{error}</span>}
    </div>
  );
}

function CardSetup({ cardId, Card }) {
  const [zoom, setZoom] = useState(100);
  const { data, setData, dirty, apply, reset, status } = useApplyEditor(cards[cardId], async (current) => {
    const { logoUpload, ...config } = current;
    const result = await postJson('/__cards/save', { cardId, config, logoUpload });
    return { data: result.config };
  });
  const set = (key) => (value) => setData((prev) => ({ ...prev, [key]: value }));
  const { logoUpload, ...config } = data;
  const check = useApplyCheck(validateCard, config);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#111827' }}>
      <ApplyBar dirty={dirty} status={status} onApply={apply} onReset={reset} check={check} />
      <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: 32, alignItems: 'start' }}>
        <div>
          <Section title="Tile">
            <CheckboxField label="Show card on the home page" checked={data.visible} onChange={set('visible')} />
          </Section>

          <Section title="Text block">
            <CheckboxField label="Show headline" checked={data.headlineVisible ?? true} onChange={set('headlineVisible')} />
            <TextField label="Headline" value={data.title} onChange={set('title')} />
            <Row>
              <SelectField label="Headline font" value={data.fontFamily} onChange={set('fontFamily')} options={FONT_OPTIONS} />
              <SelectField label="Headline type" value={data.headlineType} onChange={set('headlineType')} options={options(HEADLINE_TYPES)} />
              <SelectField
                label="Text color"
                value={data.textColor}
                onChange={set('textColor')}
                options={options(TEXT_COLORS, { dark: 'Dark', light: 'Light' })}
              />
            </Row>
            <TextAreaField label="Description" value={data.description} onChange={set('description')} />
            <Row>
              <SelectField label="Description font" value={data.descriptionFontFamily} onChange={set('descriptionFontFamily')} options={FONT_OPTIONS} />
              <SelectField
                label="Text style"
                value={data.descriptionSize}
                onChange={set('descriptionSize')}
                options={options(DESCRIPTION_SIZES, TEXT_STYLE_LABELS)}
              />
              <SelectField label="Weight" value={data.descriptionWeight} onChange={set('descriptionWeight')} options={options(TEXT_WEIGHTS, WEIGHT_LABELS)} />
            </Row>
            <LogoField
              data={data}
              onUpload={set('logoUpload')}
              onRemove={() => setData(({ logoUpload: _dropped, ...rest }) => ({ ...rest, logo: null }))}
            />
            <TextField
              label="Logo description for screen readers (company name; empty = decorative)"
              value={data.logoAlt ?? ''}
              onChange={set('logoAlt')}
            />
            <Row>
              <NumberField label="Logo height"value={data.logoSize} onChange={set('logoSize')} min={8} max={400} />
            </Row>
          </Section>

          <Section title="Button">
            <TextField label="Button text" value={data.buttonLabel ?? 'View case study'} onChange={set('buttonLabel')} />
            <Row>
              <SelectField label="Font" value={data.buttonFontFamily} onChange={set('buttonFontFamily')} options={FONT_OPTIONS} />
              <SelectField label="Text style" value={data.buttonSize} onChange={set('buttonSize')} options={options(DESCRIPTION_SIZES, TEXT_STYLE_LABELS)} />
              <SelectField label="Weight" value={data.buttonWeight} onChange={set('buttonWeight')} options={options(TEXT_WEIGHTS, WEIGHT_LABELS)} />
            </Row>
          </Section>

          <Section title="Card size">
            <Row>
              <NumberField label="Width" value={data.width} onChange={set('width')} min={100} max={3000} />
              <NumberField label="Height" value={data.height} onChange={set('height')} min={100} max={3000} />
            </Row>
          </Section>

          <Section title="Layout">
            <Row>
              <SelectField label="Text position" value={data.textPosition} onChange={set('textPosition')} options={options(TEXT_POSITIONS, capitalized)} />
              <SelectField label="Text alignment" value={data.textAlign} onChange={set('textAlign')} options={options(TEXT_ALIGNS, capitalized)} />
            </Row>
            <Row>
              <SelectField
                label="Text block width unit"
                value={data.textWidthUnit ?? 'px'}
                onChange={(unit) => setData((prev) => convertTextWidth({ ...prev, textWidthUnit: prev.textWidthUnit ?? 'px' }, unit))}
                options={options(TEXT_WIDTH_UNITS, WIDTH_UNIT_LABELS)}
              />
              {(data.textWidthUnit ?? 'px') === 'percent' ? (
                <NumberField key="percent" label="Text block width" value={data.textWidth} onChange={set('textWidth')} min={1} max={100} suffix="%" />
              ) : (
                <NumberField key="px" label="Text block width" value={data.textWidth} onChange={set('textWidth')} min={50} max={3000} />
              )}
              <SpacingField label="Padding" value={data.padding} onChange={set('padding')} />
            </Row>
          </Section>

          <Section title="Spacing">
            <Row>
              <SpacingField label="Below logo" value={data.logoGap} onChange={set('logoGap')} />
              <SpacingField label="Headline to description" value={data.textGap} onChange={set('textGap')} />
              <SpacingField label="Above button" value={data.buttonGap} onChange={set('buttonGap')} />
            </Row>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Padding and spacing use the tokens from Tokens/Spacing.</span>
          </Section>

          <Section title="Default state">
            <Row>
              <NumberField label="Radius" value={data.radius} onChange={set('radius')} min={0} max={500} />
              <NumberField label="Button radius" value={data.buttonRadius} onChange={set('buttonRadius')} min={0} max={500} />
              <NumberField label="Button opacity" value={data.buttonOpacity} onChange={set('buttonOpacity')} min={0} max={100} suffix="%" />
              <NumberField label="Gradient angle" value={data.gradientAngle} onChange={set('gradientAngle')} min={0} max={360} suffix="deg" />
            </Row>
            <Row>
              <ColorField label="Background" value={data.background} onChange={set('background')} />
              <ColorField label="Background end" value={data.backgroundEnd} onChange={set('backgroundEnd')} />
            </Row>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Same color in both = solid, different = gradient.</span>
          </Section>

          <Section title="Hover state">
            <Row>
              <SpacingField label="Padding" value={data.hoverPadding} onChange={set('hoverPadding')} />
              <NumberField label="Radius" value={data.hoverRadius} onChange={set('hoverRadius')} min={0} max={500} />
              <NumberField label="Button radius" value={data.buttonHoverRadius} onChange={set('buttonHoverRadius')} min={0} max={50} suffix="%" />
            </Row>
            <Row>
              <ColorField label="Background" value={data.hoverBackground} onChange={set('hoverBackground')} />
              <ColorField label="Background end" value={data.hoverBackgroundEnd} onChange={set('hoverBackgroundEnd')} />
            </Row>
          </Section>
        </div>

        <div style={{ position: 'sticky', top: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', fontSize: 13, color: '#6b7280' }}>
            Preview zoom
            <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6 }}>
              {[100, 75, 50].map((z) => (
                <option key={z} value={z}>
                  {z}%
                </option>
              ))}
            </select>
            <span>Hover the card to see the hover state.</span>
          </div>
          <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 140px)', padding: 4 }}>
            <div style={{ zoom: zoom / 100, width: 'max-content' }}>
              <Card {...config} visible logoUrl={logoUpload?.dataUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardSetup;
