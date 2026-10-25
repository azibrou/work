import { useState } from 'react';
import library from './memo.json';
import menu from '../top-menu/menu.json';
import pageList from '../../pages/pages.json';
import { pageLabel } from '../../pages/pageContent.js';
import Memo from './Memo.jsx';
import ApplyBar from '../../tokens/ApplyBar.jsx';
import { postJson, useApplyEditor } from '../../tokens/useTokenEditor.js';
import { useApplyCheck } from '../../tokens/useApplyCheck.js';
import { uniqueId } from '../top-menu/menuSchema.js';
import {
  validateMemoLibrary,
  HEADLINE_SIZES,
  DESCRIPTION_SIZES,
  FONT_OPTIONS,
  TEXT_COLOR_OPTIONS,
  MAX_MEMOS,
  MAX_NAME,
} from './memoSchema.js';
import { NumberField, Row, Section, SelectField, TextAreaField, TextField } from '../home-cards/setupFields.jsx';

const HEADLINE_OPTIONS = HEADLINE_SIZES.map((v) => ({ value: v, label: v === 'memo' ? 'Memo' : v.toUpperCase() }));
const DESCRIPTION_OPTIONS = DESCRIPTION_SIZES.map((v) => ({ value: v, label: `Body ${v.toUpperCase()}` }));
const NO_MEMO = '';

const smallButton = {
  padding: '6px 10px',
  font: '600 13px Inter, sans-serif',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#fff',
  color: '#111827',
  cursor: 'pointer',
};

// A copy of `memo` with a name and id no other memo uses ("Intro copy", "Intro copy 2", ...).
function copyOf(memo, memos) {
  const names = new Set(memos.map((m) => m.name.toLowerCase()));
  let name = `${memo.name} copy`.slice(0, MAX_NAME);
  for (let n = 2; names.has(name.toLowerCase()); n += 1) name = `${memo.name} copy ${n}`.slice(0, MAX_NAME);
  return { ...memo, id: uniqueId(name, memos), name };
}

export default function MemoSetup() {
  const { data, setData, dirty, apply, reset, status } = useApplyEditor(library, async (current) => {
    const result = await postJson('/__memo/save', { memos: current });
    return { data: result.memos };
  });
  const check = useApplyCheck(validateMemoLibrary, data);
  const [selectedId, setSelectedId] = useState(library.memos[0]?.id);
  const [replay, setReplay] = useState(0);

  const { memos, pages } = data;
  const selected = memos.find((m) => m.id === selectedId) ?? memos[0];
  const usedOn = (memoId) => pageList.pages.filter((page) => pages[page.id] === memoId).map((page) => pageLabel(page.id, menu, pageList));

  const set = (key) => (value) =>
    setData((prev) => ({ ...prev, memos: prev.memos.map((m) => (m.id === selected.id ? { ...m, [key]: value } : m)) }));

  const add = () => {
    if (memos.length >= MAX_MEMOS) return;
    const next = copyOf(selected, memos);
    setData((prev) => ({ ...prev, memos: [...prev.memos, next] }));
    setSelectedId(next.id);
  };

  // Pages that showed the removed memo go back to "No memo".
  const remove = () => {
    if (memos.length === 1) return;
    const rest = memos.filter((m) => m.id !== selected.id);
    setData((prev) => ({
      memos: rest,
      pages: Object.fromEntries(Object.entries(prev.pages).filter(([, memoId]) => memoId !== selected.id)),
    }));
    setSelectedId(rest[0].id);
  };

  const assign = (pageId, memoId) =>
    setData((prev) => {
      const next = { ...prev.pages };
      if (memoId === NO_MEMO) delete next[pageId];
      else next[pageId] = memoId;
      return { ...prev, pages: next };
    });

  const memoOptions = [{ value: NO_MEMO, label: 'No memo' }, ...memos.map((m) => ({ value: m.id, label: m.name }))];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#111827' }}>
      <ApplyBar dirty={dirty} status={status} onApply={apply} onReset={reset} check={check} />
      <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: 32, alignItems: 'start' }}>
        <div>
          <Section title="Pages">
            <span style={{ fontSize: 12, color: '#6b7280' }}>Pick the memo each page shows.</span>
            {pageList.pages.map((page) => (
              <SelectField
                key={page.id}
                label={pageLabel(page.id, menu, pageList)}
                value={pages[page.id] ?? NO_MEMO}
                onChange={(memoId) => assign(page.id, memoId)}
                options={memoOptions}
              />
            ))}
          </Section>

          <Section title={`Memos (${memos.length}/${MAX_MEMOS})`}>
            <div role="group" aria-label="Memo to edit" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {memos.map((m) => {
                const on = m.id === selected.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSelectedId(m.id)}
                    style={{ ...smallButton, ...(on && { background: '#111827', borderColor: '#111827', color: '#fff' }) }}
                  >
                    {m.name || 'Untitled'}
                  </button>
                );
              })}
            </div>
            <Row>
              <button type="button" onClick={add} disabled={memos.length >= MAX_MEMOS} style={{ ...smallButton, opacity: memos.length >= MAX_MEMOS ? 0.35 : 1 }}>
                + Duplicate as new memo
              </button>
              <button type="button" onClick={remove} disabled={memos.length === 1} style={{ ...smallButton, opacity: memos.length === 1 ? 0.35 : 1 }}>
                Delete “{selected.name}”
              </button>
            </Row>
            <TextField label="Name (only shown here)" value={selected.name} onChange={set('name')} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Used on: {usedOn(selected.id).join(', ') || 'no page yet'}
            </span>
          </Section>

          <Section title="Headline">
            <TextAreaField label="Text (press Enter for a new line)" value={selected.headline} onChange={set('headline')} />
            <Row>
              <SelectField label="Font" value={selected.headlineFont} onChange={set('headlineFont')} options={FONT_OPTIONS} />
              <SelectField label="Size" value={selected.headlineSize} onChange={set('headlineSize')} options={HEADLINE_OPTIONS} />
              <SelectField label="Color" value={selected.headlineColor} onChange={set('headlineColor')} options={TEXT_COLOR_OPTIONS} />
            </Row>
          </Section>
          <Section title="Description">
            <TextAreaField label="Text" value={selected.description} onChange={set('description')} />
            <Row>
              <SelectField label="Font" value={selected.descriptionFont} onChange={set('descriptionFont')} options={FONT_OPTIONS} />
              <SelectField label="Size" value={selected.descriptionSize} onChange={set('descriptionSize')} options={DESCRIPTION_OPTIONS} />
              <SelectField label="Color" value={selected.descriptionColor} onChange={set('descriptionColor')} options={TEXT_COLOR_OPTIONS} />
            </Row>
          </Section>
          <Section title="Enter animation">
            <Row>
              <NumberField label="Duration" value={selected.enterDuration} onChange={set('enterDuration')} min={0} max={5000} suffix="ms" />
              <NumberField label="Distance" value={selected.enterDistance} onChange={set('enterDistance')} min={0} max={400} />
            </Row>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Slides down from this far above, with ease-out. Plays on load and whenever the memo scrolls back into view.
            </span>
          </Section>
          <p style={{ fontSize: 12, color: '#6b7280' }}>
            Sizes use the type scale from Tokens/Typography; colors are the Content colors from Tokens/Color. The headline
            stays an H1 on the page for SEO. New pages show no memo until you pick one above.
          </p>
        </div>
        <div style={{ position: 'sticky', top: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', fontSize: 13, color: '#6b7280' }}>
            <button type="button" onClick={() => setReplay((n) => n + 1)} style={{ ...smallButton, borderColor: '#111827' }}>
              Replay animation
            </button>
            Previewing “{selected.name}”.
          </div>
          <div style={{ border: '1px dashed #e5e7eb', borderRadius: 8 }}>
            {/* A new key remounts the memo, which starts the enter animation again. */}
            <Memo key={`${selected.id}-${replay}-${selected.enterDuration}-${selected.enterDistance}`} {...selected} />
          </div>
        </div>
      </div>
    </div>
  );
}
