import typography from './typography.json';
import { useTokenEditor } from '../useTokenEditor.js';
import ApplyBar from '../ApplyBar.jsx';

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const input = { padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, font: '13px Inter, sans-serif' };
const caption = { font: '12px ui-monospace, monospace', color: '#6b7280' };

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6b7280' }}>
      {label}
      {children}
    </label>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.round(Number(e.target.value) || 1)))}
        style={{ ...input, width: 72 }}
      />
    </Field>
  );
}

function WeightSelect({ label, value, onChange }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} style={input}>
        {WEIGHTS.map((w) => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Row({ name, token, samples, onChange, children }) {
  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 12 }}>
        <div style={{ width: 90 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{token.label}</div>
          <div style={caption}>{name}</div>
        </div>
        <NumberField label="Size (px)" value={token.fontSize} onChange={(fontSize) => onChange({ ...token, fontSize })} />
        <NumberField
          label="Line height (px)"
          value={token.lineHeight}
          onChange={(lineHeight) => onChange({ ...token, lineHeight })}
        />
        {children}
      </div>
      {samples.map(({ weight, text }) => (
        <div key={text} style={{ fontSize: token.fontSize, lineHeight: `${token.lineHeight}px`, fontWeight: weight }}>
          {text}
        </div>
      ))}
    </div>
  );
}

function TypographyEditor() {
  const { data, setData, dirty, apply, reset, status } = useTokenEditor('typography', typography);
  const setGroup = (group, key) => (next) =>
    setData((prev) => ({ ...prev, [group]: { ...prev[group], [key]: next } }));

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#111827', maxWidth: 820 }}>
      <ApplyBar dirty={dirty} status={status} onApply={apply} onReset={reset} />

      <div style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ width: 90, fontWeight: 600, fontSize: 14 }}>Weights</div>
        <WeightSelect
          label="Regular"
          value={data.weights.regular}
          onChange={(regular) => setData((prev) => ({ ...prev, weights: { ...prev.weights, regular } }))}
        />
        <WeightSelect
          label="Bold"
          value={data.weights.bold}
          onChange={(bold) => setData((prev) => ({ ...prev, weights: { ...prev.weights, bold } }))}
        />
      </div>

      {Object.entries(data.headings).map(([key, token]) => (
        <Row
          key={key}
          name={`--font-size-${key}`}
          token={token}
          samples={[{ weight: token.fontWeight, text: `${token.label} heading` }]}
          onChange={setGroup('headings', key)}
        >
          <WeightSelect
            label="Weight"
            value={token.fontWeight}
            onChange={(fontWeight) => setGroup('headings', key)({ ...token, fontWeight })}
          />
        </Row>
      ))}

      {Object.entries(data.body).map(([key, token]) => (
        <Row
          key={key}
          name={`--font-size-body-${key}`}
          token={token}
          samples={[
            { weight: data.weights.regular, text: `${token.label} / Regular` },
            { weight: data.weights.bold, text: `${token.label} / Bold` },
          ]}
          onChange={setGroup('body', key)}
        />
      ))}
    </div>
  );
}

export default TypographyEditor;
