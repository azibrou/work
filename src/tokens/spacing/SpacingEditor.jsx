import { useMemo, useState } from 'react';
import spacing from './spacing.json';
import cards from '../../components/home-cards/cards.json';
import sections from '../../components/sections/sections.json';
import { generateCss, MAX_SPACING, SPACING_NAME } from '../generate.js';
import { useTokenEditor } from '../useTokenEditor.js';
import { useApplyCheck } from '../useApplyCheck.js';
import { assertSpacingKept, findSpacingUses } from './usage.js';
import ApplyBar from '../ApplyBar.jsx';

// Stylesheets and components that reference --space-* directly (this folder holds the tokens themselves).
const files = import.meta.glob(['/src/**/*.css', '/src/**/*.jsx', '!/src/tokens/spacing/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

const input = { padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, font: '13px Inter, sans-serif' };
const mono = { font: '12px ui-monospace, monospace', color: '#6b7280' };
const button = { padding: '6px 12px', font: '600 13px Inter, sans-serif', borderRadius: 6, cursor: 'pointer' };

const clamp = (n) => Math.min(MAX_SPACING, Math.max(0, Math.round(Number(n) || 0)));
const insertSorted = (tokens, token) => {
  const index = tokens.findIndex((t) => t.value > token.value);
  return index === -1 ? [...tokens, token] : [...tokens.slice(0, index), token, ...tokens.slice(index)];
};

function TokenRow({ token, uses, onChange, onRemove }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 100px minmax(120px, 1fr) 90px',
        alignItems: 'center',
        gap: 16,
        padding: '10px 0',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <div style={{ ...mono, color: '#111827' }}>--space-{token.name}</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4b5563' }}>
        <input
          type="number"
          min={0}
          max={MAX_SPACING}
          aria-label={`--space-${token.name} value in px`}
          value={token.value}
          onChange={(e) => onChange({ ...token, value: clamp(e.target.value) })}
          style={{ ...input, width: 64 }}
        />
        px
      </label>
      <div style={{ minWidth: 0 }}>
        <div style={{ width: token.value, maxWidth: '100%', height: 16, background: '#4338CA', borderRadius: 2, opacity: 0.8 }} />
        <div style={{ ...mono, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={uses?.join(', ')}>
          {uses ? `Used by ${uses.join(', ')}` : 'Not used'}
        </div>
      </div>
      <button
        type="button"
        disabled={!!uses}
        title={uses ? 'In use, so it cannot be removed' : `Remove --space-${token.name}`}
        onClick={onRemove}
        style={{ ...button, border: '1px solid #d1d5db', background: '#fff', opacity: uses ? 0.35 : 1, cursor: uses ? 'not-allowed' : 'pointer' }}
      >
        Remove
      </button>
    </div>
  );
}

function AddToken({ existing, onAdd }) {
  const [value, setValue] = useState(48);
  const [name, setName] = useState('');
  const finalName = (name.trim() || String(value)).toLowerCase();
  const error = !SPACING_NAME.test(finalName)
    ? 'Name: lowercase letters, numbers and dashes'
    : existing.includes(finalName)
      ? `--space-${finalName} already exists`
      : '';

  function submit(e) {
    e.preventDefault();
    if (error) return;
    onAdd({ name: finalName, value });
    setName('');
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '16px 0' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4b5563' }}>
        <input
          type="number"
          min={0}
          max={MAX_SPACING}
          aria-label="New token value in px"
          value={value}
          onChange={(e) => setValue(clamp(e.target.value))}
          style={{ ...input, width: 64 }}
        />
        px
      </label>
      <input
        aria-label="New token name"
        placeholder={`Name (default ${value})`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ ...input, width: 150 }}
      />
      <button
        type="submit"
        disabled={!!error}
        style={{ ...button, color: '#fff', background: '#4338CA', border: 'none', opacity: error ? 0.5 : 1, cursor: error ? 'not-allowed' : 'pointer' }}
      >
        + Add token
      </button>
      <span style={error ? { fontSize: 12, color: '#b91c1c' } : mono}>{error || `--space-${finalName}`}</span>
    </form>
  );
}

function SpacingEditor() {
  const { data, setData, dirty, apply, reset, status } = useTokenEditor('spacing', spacing);
  const uses = useMemo(() => findSpacingUses({ cards, sections, files }), []);
  const validate = useMemo(
    () => (d) => {
      generateCss('spacing', d);
      assertSpacingKept(d.tokens, uses);
    },
    [uses],
  );
  const check = useApplyCheck(validate, data);
  const setTokens = (update) => setData((prev) => ({ ...prev, tokens: update(prev.tokens) }));

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#111827', maxWidth: 820 }}>
      <ApplyBar dirty={dirty} status={status} onApply={apply} onReset={reset} check={check} />
      <p style={{ fontSize: 13, color: '#4b5563', margin: '16px 0 8px' }}>
        Paddings, gaps and margins. Cards and sections pick from this list, and the page styles use the variables directly.
        Changing a value updates every place that uses the token. A token that is in use can't be removed.
      </p>
      {data.tokens.map((token, index) => (
        <TokenRow
          key={token.name}
          token={token}
          uses={uses[token.name]}
          onChange={(next) => setTokens((list) => list.map((t, i) => (i === index ? next : t)))}
          onRemove={() => setTokens((list) => list.filter((_, i) => i !== index))}
        />
      ))}
      <AddToken existing={data.tokens.map((t) => t.name)} onAdd={(token) => setTokens((list) => insertSorted(list, token))} />
    </div>
  );
}

export default SpacingEditor;
