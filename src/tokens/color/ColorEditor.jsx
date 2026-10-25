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

function Swatch({ value }) {
  return (
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
      <div style={{ width: '100%', height: '100%', background: toCssValue(value) }} />
    </div>
  );
}

// Picker, hex and (for tokens that have one) opacity for one mode of a token.
function ColorControls({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Swatch value={value} />
      <input
        type="color"
        aria-label={`${label} color picker`}
        value={value.hex}
        onChange={(e) => onChange({ hex: e.target.value })}
        style={{ width: 40, height: 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
      />
      <HexField hex={value.hex} onChange={(hex) => onChange({ hex })} />
      {value.opacity !== undefined && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4b5563' }}>
          <input
            type="number"
            min={0}
            max={100}
            aria-label={`${label} opacity`}
            value={value.opacity}
            onChange={(e) => onChange({ opacity: Math.min(100, Math.max(0, Math.round(Number(e.target.value) || 0))) })}
            style={{ width: 60, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6 }}
          />
          %
        </label>
      )}
    </div>
  );
}

const ROW = { display: 'grid', gridTemplateColumns: '150px 300px 300px', alignItems: 'center', gap: 16, padding: '8px 0' };

function ColorRow({ token, onLight, onDark }) {
  return (
    <div style={ROW}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{token.label}</div>
        <div style={{ font: '12px ui-monospace, monospace', color: '#6b7280' }}>{token.cssVar}</div>
      </div>
      <ColorControls label={`${token.label} light`} value={token} onChange={onLight} />
      <ColorControls label={`${token.label} dark`} value={token.dark} onChange={onDark} />
    </div>
  );
}

function Preview({ vars, title }) {
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
        flex: '1 1 0',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
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
  const tokens = data.groups.flatMap((g) => g.tokens);
  const lightVars = Object.fromEntries(tokens.map((t) => [t.cssVar, toCssValue(t)]));
  const darkVars = Object.fromEntries(tokens.map((t) => [t.cssVar, toCssValue(t.dark)]));

  const updateToken = (cssVar, update) =>
    setData((prev) => ({
      groups: prev.groups.map((g) => ({
        ...g,
        tokens: g.tokens.map((t) => (t.cssVar === cssVar ? update(t) : t)),
      })),
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, fontFamily: "'Inter', sans-serif", color: '#111827' }}>
      <ApplyBar dirty={dirty} status={status} onApply={apply} onReset={reset} />
      <p style={{ margin: 0, fontSize: 13, color: '#6b7280', maxWidth: 760 }}>
        Every token has a light and a dark value. Pages use the light values; a page&apos;s look is set by its theme under
        Pages (the Geek theme brings its own colors). Dark values are kept for a future theme.
      </p>
      {data.groups.map((group) => (
        <section key={group.name}>
          <h3 style={{ margin: 0, fontSize: 18 }}>{group.name}</h3>
          <p style={{ margin: '2px 0 8px', fontSize: 13, color: '#6b7280' }}>{group.description}</p>
          <div style={{ ...ROW, padding: 0, fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
            <span>Token</span>
            <span>Light</span>
            <span>Dark</span>
          </div>
          {group.tokens.map((token) => (
            <ColorRow
              key={token.cssVar}
              token={token}
              onLight={(patch) => updateToken(token.cssVar, (t) => ({ ...t, ...patch }))}
              onDark={(patch) => updateToken(token.cssVar, (t) => ({ ...t, dark: { ...t.dark, ...patch } }))}
            />
          ))}
        </section>
      ))}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Preview vars={lightVars} title="Light preview" />
        <Preview vars={darkVars} title="Dark preview" />
      </div>
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
