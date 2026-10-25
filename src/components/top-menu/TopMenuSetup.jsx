import { useState } from 'react';
import menu from './menu.json';
import pages from '../../pages/pages.json';
import TopMenu from './TopMenu.jsx';
import ApplyBar from '../../tokens/ApplyBar.jsx';
import { postJson, useApplyEditor } from '../../tokens/useTokenEditor.js';
import { useApplyCheck } from '../../tokens/useApplyCheck.js';
import { validateMenu, uniqueId, MAX_ITEMS, MAX_LABEL } from './menuSchema.js';
import { DEFAULT_TRANSITION, TRANSITION_OPTIONS } from '../../transitions/registry.js';
import { Section } from '../home-cards/setupFields.jsx';

const control = { padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, font: '13px Inter, sans-serif' };
const smallButton = {
  padding: '6px 10px',
  font: '600 13px Inter, sans-serif',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
};
const columnHead = { fontSize: 12, color: '#6b7280' };

function IconButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{ ...smallButton, width: 32, padding: '6px 0', opacity: disabled ? 0.35 : 1, cursor: disabled ? 'default' : 'pointer' }}
    >
      {children}
    </button>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} style={control}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Pages are listed by their own name here: the menu label is what this setup edits.
const PAGE_OPTIONS = pages.pages.map((p) => ({ value: p.id, label: p.name }));
const row = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px 130px repeat(3, 32px)', alignItems: 'center', gap: 6 };

export default function TopMenuSetup() {
  const { data, setData, dirty, apply, reset, status } = useApplyEditor(menu, async (current) => {
    const result = await postJson('/__menu/save', { menu: current });
    return { data: result.menu };
  });
  const check = useApplyCheck(validateMenu, data);
  const [newLabel, setNewLabel] = useState('');
  const [active, setActive] = useState(menu.items[0]?.id);
  const { items } = data;

  const setItems = (update) => setData((prev) => ({ ...prev, items: update(prev.items) }));
  const change = (index, key, value) => setItems((list) => list.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  const remove = (index) => setItems((list) => list.filter((_, i) => i !== index));
  const move = (index, step) =>
    setItems((list) => {
      const next = [...list];
      [next[index], next[index + step]] = [next[index + step], next[index]];
      return next;
    });

  const trimmed = newLabel.trim();
  const canAdd = trimmed && items.length < MAX_ITEMS;
  const add = () => {
    if (!canAdd) return;
    setItems((list) => {
      // A new item opens the first page no item links to yet, else the first page.
      const free = pages.pages.find((p) => !list.some((item) => item.page === p.id)) ?? pages.pages[0];
      return [...list, { id: uniqueId(trimmed, list), label: trimmed, page: free.id, transition: DEFAULT_TRANSITION }];
    });
    setNewLabel('');
  };
  const unlinked = pages.pages.filter((p) => !items.some((item) => item.page === p.id));

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#111827' }}>
      <ApplyBar dirty={dirty} status={status} onApply={apply} onReset={reset} check={check} />
      <div style={{ display: 'grid', gridTemplateColumns: '640px minmax(0, 1fr)', gap: 32, alignItems: 'start' }}>
        <div>
          <Section title={`Items (${items.length}/${MAX_ITEMS})`}>
            <div style={row} aria-hidden="true">
              <span style={columnHead}>Label</span>
              <span style={columnHead}>Page</span>
              <span style={columnHead}>Transition</span>
            </div>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, index) => (
                <li key={item.id} style={row}>
                  <input
                    aria-label={`Item ${index + 1} label`}
                    value={item.label}
                    maxLength={MAX_LABEL}
                    onChange={(e) => change(index, 'label', e.target.value)}
                    style={control}
                  />
                  <Select label={`Item ${index + 1} page`} value={item.page} onChange={(v) => change(index, 'page', v)} options={PAGE_OPTIONS} />
                  <Select
                    label={`Item ${index + 1} transition`}
                    value={item.transition}
                    onChange={(v) => change(index, 'transition', v)}
                    options={TRANSITION_OPTIONS}
                  />
                  <IconButton label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                    ↑
                  </IconButton>
                  <IconButton label="Move down" disabled={index === items.length - 1} onClick={() => move(index, 1)}>
                    ↓
                  </IconButton>
                  <IconButton label={`Remove ${item.label || 'item'}`} disabled={items.length === 1} onClick={() => remove(index)}>
                    ✕
                  </IconButton>
                </li>
              ))}
            </ol>
            <form
              style={{ display: 'flex', gap: 6 }}
              onSubmit={(e) => {
                e.preventDefault();
                add();
              }}
            >
              <input
                aria-label="New item label"
                placeholder="New item label"
                value={newLabel}
                maxLength={MAX_LABEL}
                onChange={(e) => setNewLabel(e.target.value)}
                style={{ ...control, flex: 1 }}
              />
              <button type="submit" disabled={!canAdd} style={{ ...smallButton, opacity: canAdd ? 1 : 0.35 }}>
                Add item
              </button>
            </form>
          </Section>
          {unlinked.length > 0 && (
            <p style={{ fontSize: 12, color: '#b45309' }}>
              Not in the navigation: {unlinked.map((p) => p.name).join(', ')}. These pages are kept; pick them for an item to show them again.
            </p>
          )}
          <p style={{ fontSize: 12, color: '#6b7280' }}>
            The first item is selected when the site loads. <strong>Page</strong> picks which page the item opens; the page&apos;s name
            in Storybook (Pages, Components/Cards) follows the label of the first item that opens it. Removing an item never removes its
            page. <strong>Transition</strong> plays when the item&apos;s page opens: Default swaps the page with no animation; the others
            come from the Transitions section. A page&apos;s look comes from its theme, set under Pages.
          </p>
        </div>
        <div style={{ position: 'sticky', top: 64 }}>
          <div style={{ padding: '12px 0', fontSize: 13, color: '#6b7280' }}>Preview (click to try the active state)</div>
          <div style={{ border: '1px dashed #e5e7eb', borderRadius: 8, padding: 24 }}>
            <TopMenu items={items} active={items.some((i) => i.id === active) ? active : items[0]?.id} onChange={setActive} />
          </div>
        </div>
      </div>
    </div>
  );
}
