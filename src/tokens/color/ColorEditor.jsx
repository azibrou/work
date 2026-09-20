import { useState } from 'react';
import color from './color.json';
import { generateCss, normalizeHex, toCssValue } from '../generate.js';
import { useTokenEditor } from '../useTokenEditor.js';
import ApplyBar from '../ApplyBar.jsx';

function HexField({ hex, onChange }) {
  const [draft, setDraft] = useState(null);
  const valid = draft === null || normalizeHex(draft) !== null;

  return (
    <input
      value={draft ?? hex}
      spellCheck={false}
      aria-label="Hex code"
      onChange={(e) => {
        setDraft(e.target.value);
        const next = normalizeHex(e.target.value);
        if (next) onChange(next);
      }}
      onBlur={() => setDraft(null)}
      style={{
        width: 88,
        padding: '6px 8px',
        font: '13px ui-monospace, monospace',
        border: `1px solid ${valid ? '#d1d5db' : '#dc2626'}`,
        borderRadius: 6,
      }}
    />
  );
}

function ColorRow({ token, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          border: '1px solid #d1d5db',
          backgroundImage: 'conic-gradient(#e5e7eb 25%, #fff 0 50%, #e5e7eb 0 75%, #fff 0)',
          backgroundSize: '10px 10px',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{ width: '100%', height: '100%', background: toCssValue(token) }} />
      </div>
      <div style={{ width: 130 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{token.label}</div>
        <div style={{ font: '12px ui-monospace, monospace', color: '#6b7280' }}>{token.cssVar}</div>
      </div>
      <input
        type="color"
        aria-label={`${token.label} color picker`}
        value={token.hex}
        onChange={(e) => onChange({ hex: e.target.value })}
        style={{ width: 40, height: 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
      />
      <HexField hex={token.hex} onChange={(hex) => onChange({ hex })} />
      {token.opacity !== undefined && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4b5563' }}>
          Opacity
          <input
            type="number"
            min={0}
            max={100}
            value={token.opacity}
            onChange={(e) => onChange({ opacity: Math.min(100, Math.max(0, Math.round(Number(e.target.value) || 0))) })}
            style={{ width: 60, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6 }}
          />
          %
        </label>
      )}
    </div>
  );
}

function Preview({ vars }) {
  const tile = {
    width: 200,
    height: 120,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    padding: 12,
    boxSizing: 'border-box',
  };
  return (
    <div
      style={{
        ...vars,
        background: 'var(--color-floor-0)',
        color: 'var(--color-text)',
        padding: 24,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Preview</div>
      <p style={{ margin: '0 0 16px' }}>
        Body text with a{' '}
        <a href="#preview" onClick={(e) => e.preventDefault()} style={{ color: 'var(--color-link)' }}>
          link
        </a>{' '}
        on Floor 0.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ ...tile, background: 'var(--color-floor-1)' }}>Floor 1</div>
        <div style={{ ...tile, background: 'var(--color-floor-2)' }}>Floor 2</div>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ ...tile, background: `var(--color-surface-${n})` }}>
            Surface {n}
          </div>
        ))}
        <div style={{ ...tile, background: '#fff' }}>White tile, no shader</div>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ ...tile, background: '#fff' }}>
            White tile + Shader {n}
            <div style={{ position: 'absolute', inset: 0, background: `var(--color-shader-${n})`, pointerEvents: 'none' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorEditor() {
  const { data, setData, dirty, apply, reset, status } = useTokenEditor('color', color);
  const vars = Object.fromEntries(data.groups.flatMap((g) => g.tokens.map((t) => [t.cssVar, toCssValue(t)])));

  const updateToken = (cssVar, patch) =>
    setData((prev) => ({
      groups: prev.groups.map((g) => ({
        ...g,
        tokens: g.tokens.map((t) => (t.cssVar === cssVar ? { ...t, ...patch } : t)),
      })),
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, fontFamily: "'Inter', sans-serif", color: '#111827' }}>
      <ApplyBar dirty={dirty} status={status} onApply={apply} onReset={reset} />
      {data.groups.map((group) => (
        <section key={group.name}>
          <h3 style={{ margin: 0, fontSize: 18 }}>{group.name}</h3>
          <p style={{ margin: '2px 0 8px', fontSize: 13, color: '#6b7280' }}>{group.description}</p>
          {group.tokens.map((token) => (
            <ColorRow key={token.cssVar} token={token} onChange={(patch) => updateToken(token.cssVar, patch)} />
          ))}
        </section>
      ))}
      <Preview vars={vars} />
      <section>
        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>CSS output</h3>
        <pre
          style={{
            margin: 0,
            padding: 16,
            background: '#f3f4f6',
            borderRadius: 8,
            font: '13px/20px ui-monospace, monospace',
            overflow: 'auto',
          }}
        >
          {generateCss('color', data)}
        </pre>
      </section>
    </div>
  );
}

export default ColorEditor;
