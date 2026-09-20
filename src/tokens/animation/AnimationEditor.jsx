import { useState } from 'react';
import animation from './animation.json';
import { EASINGS } from '../generate.js';
import { useTokenEditor } from '../useTokenEditor.js';
import ApplyBar from '../ApplyBar.jsx';

const input = { padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, font: '13px Inter, sans-serif' };

function TokenRow({ tokenKey, token, onChange }) {
  const [active, setActive] = useState(false);
  const easing = EASINGS[token.easing];
  const transition = ['left', 'border-radius', 'background-color']
    .map((prop) => `${prop} ${token.duration}ms ${easing}`)
    .join(', ');

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '150px 110px 130px minmax(160px, 1fr) 90px',
        alignItems: 'center',
        gap: 16,
        padding: '14px 0',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <div>
        <input
          aria-label={`${tokenKey} pattern name`}
          value={token.label}
          onChange={(e) => onChange({ ...token, label: e.target.value })}
          style={{ ...input, width: '100%', boxSizing: 'border-box', fontWeight: 600, fontSize: 14, marginBottom: 4 }}
        />
        <div style={{ font: '12px ui-monospace, monospace', color: '#6b7280' }}>--duration-{tokenKey}</div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4b5563' }}>
        <input
          type="number"
          min={0}
          max={10000}
          step={10}
          aria-label={`${token.label} duration in ms`}
          value={token.duration}
          onChange={(e) => onChange({ ...token, duration: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
          style={{ ...input, width: 68 }}
        />
        ms
      </label>
      <select
        aria-label={`${token.label} easing`}
        value={token.easing}
        onChange={(e) => onChange({ ...token, easing: e.target.value })}
        style={input}
      >
        {Object.keys(EASINGS).map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <div style={{ position: 'relative', height: 48, background: '#f3f4f6', borderRadius: 8 }}>
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: active ? 'calc(100% - 40px)' : 8,
            width: 32,
            height: 32,
            borderRadius: active ? 16 : 6,
            background: active ? '#4338CA' : '#111827',
            transition,
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => setActive((current) => !current)}
        style={{
          padding: '8px 12px',
          font: '600 13px Inter, sans-serif',
          color: '#fff',
          background: '#111827',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        {active ? '↺ Reverse' : '▶ Play'}
      </button>
    </div>
  );
}

function AddPattern({ existingKeys, onAdd }) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(200);
  const [easing, setEasing] = useState('ease-out');
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const error = name && (!key ? 'Use letters or numbers' : existingKeys.includes(key) ? `"${key}" already exists` : '');

  function submit(e) {
    e.preventDefault();
    if (!key || error) return;
    onAdd(key, { label: name.trim(), duration, easing });
    setName('');
    setDuration(200);
    setEasing('ease-out');
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '16px 0' }}
    >
      <input
        aria-label="New pattern name"
        placeholder="New pattern name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ ...input, width: 160 }}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4b5563' }}>
        <input
          type="number"
          min={0}
          max={10000}
          step={10}
          aria-label="New pattern duration in ms"
          value={duration}
          onChange={(e) => setDuration(Math.max(0, Math.round(Number(e.target.value) || 0)))}
          style={{ ...input, width: 68 }}
        />
        ms
      </label>
      <select aria-label="New pattern easing" value={easing} onChange={(e) => setEasing(e.target.value)} style={input}>
        {Object.keys(EASINGS).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!key || !!error}
        style={{
          padding: '8px 12px',
          font: '600 13px Inter, sans-serif',
          color: '#fff',
          background: '#4338CA',
          border: 'none',
          borderRadius: 6,
          cursor: key && !error ? 'pointer' : 'not-allowed',
          opacity: key && !error ? 1 : 0.5,
        }}
      >
        + Add pattern
      </button>
      {key && !error && (
        <span style={{ font: '12px ui-monospace, monospace', color: '#6b7280' }}>--duration-{key}</span>
      )}
      {error && <span style={{ fontSize: 12, color: '#b91c1c' }}>{error}</span>}
    </form>
  );
}

function AnimationEditor() {
  const { data, setData, dirty, apply, reset, status } = useTokenEditor('animation', animation);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#111827', maxWidth: 820 }}>
      <ApplyBar dirty={dirty} status={status} onApply={apply} onReset={reset} />
      {Object.entries(data.tokens).map(([key, token]) => (
        <TokenRow
          key={key}
          tokenKey={key}
          token={token}
          onChange={(next) => setData((prev) => ({ tokens: { ...prev.tokens, [key]: next } }))}
        />
      ))}
      <AddPattern
        existingKeys={Object.keys(data.tokens)}
        onAdd={(key, token) => setData((prev) => ({ tokens: { ...prev.tokens, [key]: token } }))}
      />
    </div>
  );
}

export default AnimationEditor;
