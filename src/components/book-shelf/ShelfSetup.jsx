import { useState } from 'react';
import shelf from './shelf.json';
import BookShelf from './BookShelf.jsx';
import ApplyBar from '../../tokens/ApplyBar.jsx';
import { postJson, useApplyEditor } from '../../tokens/useTokenEditor.js';
import { useApplyCheck } from '../../tokens/useApplyCheck.js';
import { validateShelf, nextBookId, MAX_BOOKS, MAX_TITLE } from './shelfSchema.js';
import { FONT_OPTIONS, TEXT_COLOR_OPTIONS } from '../memo/memoSchema.js';
import { HEADLINE_TYPES } from '../home-cards/cardSchema.js';
import { Row, Section, SelectField, TextField } from '../home-cards/setupFields.jsx';

const SIZE_OPTIONS = HEADLINE_TYPES.map((v) => ({ value: v, label: v.toUpperCase() }));
const STEP_OPTIONS = [
  { value: 'cover', label: 'One cover' },
  { value: 'page', label: 'Everything in view' },
];
const control = { padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, font: '13px Inter, sans-serif' };
const smallButton = { padding: '6px 10px', font: '600 13px Inter, sans-serif', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer' };

export default function ShelfSetup() {
  const { data, setData, dirty, apply, reset, status } = useApplyEditor(shelf, async (current) => {
    const result = await postJson('/__shelf/save', { shelf: current });
    return { data: result.shelf };
  });
  const check = useApplyCheck(validateShelf, data);
  const [previewWidth, setPreviewWidth] = useState(720);
  const set = (key) => (value) => setData((prev) => ({ ...prev, [key]: value }));
  const setBooks = (update) => setData((prev) => ({ ...prev, books: update(prev.books) }));
  const { books } = data;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#111827' }}>
      <ApplyBar dirty={dirty} status={status} onApply={apply} onReset={reset} check={check} />
      <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: 32, alignItems: 'start' }}>
        <div>
          <Section title="Headline">
            <TextField label="Text" value={data.headline} onChange={set('headline')} />
            <Row>
              <SelectField label="Font" value={data.headlineFont} onChange={set('headlineFont')} options={FONT_OPTIONS} />
              <SelectField label="Size" value={data.headlineSize} onChange={set('headlineSize')} options={SIZE_OPTIONS} />
              <SelectField label="Color" value={data.headlineColor} onChange={set('headlineColor')} options={TEXT_COLOR_OPTIONS} />
            </Row>
          </Section>
          <Section title="Scrolling">
            <SelectField label="Arrow buttons scroll by" value={data.scrollStep} onChange={set('scrollStep')} options={STEP_OPTIONS} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>An arrow shows on a side only while covers are hidden past that edge.</span>
          </Section>
          <Section title={`Covers (${books.length}/${MAX_BOOKS})`}>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {books.map((book, index) => (
                <li key={book.id} style={{ display: 'flex', gap: 6 }}>
                  <input
                    aria-label={`Cover ${index + 1} title`}
                    value={book.title}
                    maxLength={MAX_TITLE}
                    onChange={(e) => setBooks((list) => list.map((b) => (b.id === book.id ? { ...b, title: e.target.value } : b)))}
                    style={{ ...control, flex: 1 }}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${book.title || 'cover'}`}
                    disabled={books.length === 1}
                    onClick={() => setBooks((list) => list.filter((b) => b.id !== book.id))}
                    style={{ ...smallButton, opacity: books.length === 1 ? 0.35 : 1 }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              disabled={books.length >= MAX_BOOKS}
              onClick={() => setBooks((list) => [...list, { id: nextBookId(list), title: `Book ${list.length + 1}` }])}
              style={{ ...smallButton, alignSelf: 'start', opacity: books.length >= MAX_BOOKS ? 0.35 : 1 }}
            >
              + Add cover
            </button>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Titles aren&apos;t drawn on the covers; screen readers read them.</span>
          </Section>
        </div>
        <div style={{ position: 'sticky', top: 64 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', fontSize: 13, color: '#6b7280' }}>
            Preview width
            <input type="range" min={240} max={1216} value={previewWidth} onChange={(e) => setPreviewWidth(Number(e.target.value))} />
            {previewWidth}px
          </label>
          <div style={{ width: previewWidth, maxWidth: '100%', padding: 24, background: 'var(--color-floor-0)', border: '1px dashed #e5e7eb', borderRadius: 8 }}>
            <BookShelf {...data} />
          </div>
        </div>
      </div>
    </div>
  );
}
