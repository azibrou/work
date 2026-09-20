import { useState } from 'react';
import { normalizeHex } from '../../tokens/generate.js';

const control = { padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, font: '13px Inter, sans-serif' };
const labelText = { fontSize: 12, color: '#6b7280' };

export function Section({ title, children }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: 0, fontSize: 15 }}>{title}</h3>
      {children}
    </section>
  );
}

export function Row({ children }) {
  return <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{children}</div>;
}

function Field({ label, children, grow }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: grow ? '1 1 100%' : '0 0 auto' }}>
      <span style={labelText}>{label}</span>
      {children}
    </label>
  );
}

export function TextField({ label, value, onChange }) {
  return (
    <Field label={label} grow>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={control} />
    </Field>
  );
}

export function TextAreaField({ label, value, onChange }) {
  return (
    <Field label={label} grow>
      <textarea value={value} rows={3} onChange={(e) => onChange(e.target.value)} style={{ ...control, resize: 'vertical' }} />
    </Field>
  );
}

export function NumberField({ label, value, onChange, min, max, suffix = 'px' }) {
  const [draft, setDraft] = useState(null);
  const parsed = draft === null ? value : Number(draft);
  const valid = draft === null || (draft.trim() !== '' && Number.isInteger(parsed) && parsed >= min && parsed <= max);

  return (
    <Field label={`${label} (${suffix})`}>
      <input
        type="number"
        min={min}
        max={max}
        value={draft ?? value}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value.trim() !== '' && Number.isInteger(n) && n >= min && n <= max) onChange(n);
        }}
        onBlur={() => setDraft(null)}
        style={{ ...control, width: 84, borderColor: valid ? '#d1d5db' : '#dc2626' }}
      />
    </Field>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={control}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function ColorField({ label, value, onChange }) {
  const [draft, setDraft] = useState(null);
  const valid = draft === null || normalizeHex(draft) !== null;

  return (
    <Field label={label}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="color"
          aria-label={`${label} color picker`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 36, height: 30, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
        />
        <input
          aria-label={`${label} hex code`}
          value={draft ?? value}
          spellCheck={false}
          onChange={(e) => {
            setDraft(e.target.value);
            const next = normalizeHex(e.target.value);
            if (next) onChange(next);
          }}
          onBlur={() => setDraft(null)}
          style={{ ...control, width: 88, font: '13px ui-monospace, monospace', borderColor: valid ? '#d1d5db' : '#dc2626' }}
        />
      </span>
    </Field>
  );
}

export function CheckboxField({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, font: '13px Inter, sans-serif', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
