import { useLayoutEffect } from 'react';
import menu from '../../components/top-menu/menu.json';
import pagesConfig from '../pages.json';
import Page from '../Page.jsx';
import { pageLabel } from '../pageContent.js';
import { validatePages, MAX_PAGE_NAME } from '../pagesSchema.js';
import { THEME_OPTIONS, applyTheme } from '../themes.js';
import { useMainStyles } from '../../transitions/storybook/useMainStyles.js';
import { AppShell } from '../../transitions/storybook/AppShell.jsx';
import { postJson, useApplyEditor } from '../../tokens/useTokenEditor.js';
import { useApplyCheck } from '../../tokens/useApplyCheck.js';
import '../themes.css';

const panel = {
  position: 'fixed',
  right: 12,
  bottom: 12,
  zIndex: 2147483600,
  width: 280,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 14,
  background: '#fff',
  color: '#111827',
  colorScheme: 'light',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  font: '13px Inter, sans-serif',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};
const control = { padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, font: '13px Inter, sans-serif', color: '#111827', background: '#fff' };
const field = { display: 'flex', flexDirection: 'column', gap: 4 };
const hint = { fontSize: 12, color: '#6b7280' };
// A page outside the navigation: no menu, no transitions, just the page in its theme.
function StandalonePage({ pageId, theme }) {
  useMainStyles();
  useLayoutEffect(() => {
    applyTheme(theme);
    return () => applyTheme(null);
  }, [theme]);
  return (
    <div className="main-container">
      <main id="main-content">
        <Page id={pageId} />
      </main>
    </div>
  );
}

const button = { padding: '6px 12px', font: '600 13px Inter, sans-serif', borderRadius: 6, border: '1px solid #111827', cursor: 'pointer' };

/**
 * One page in the real app (top navigation + transitions), starting on that
 * page, with a setup panel for the page's theme and fallback name. Apply
 * writes pages.json. A page no navigation item opens is shown on its own.
 */
export default function PageStory({ pageId, args }) {
  const { data, setData, dirty, apply, reset, status } = useApplyEditor(pagesConfig, async (current) => {
    const result = await postJson('/__pages/save', { pages: current });
    return { data: result.pages };
  });
  const check = useApplyCheck(validatePages, data);
  const page = data.pages.find((p) => p.id === pageId);
  const theme = page?.theme;

  const linked = menu.items.filter((item) => item.page === pageId);

  if (!page) return <p style={{ padding: 24 }}>No page &quot;{pageId}&quot; in pages.json.</p>;

  const set = (key) => (value) => setData((prev) => ({ pages: prev.pages.map((p) => (p.id === pageId ? { ...p, [key]: value } : p)) }));
  const blocked = dirty && !check.ok;
  let message = status.message;
  if (blocked) message = `Cannot apply: ${check.error}`;
  else if (dirty && status.state !== 'error') message = 'Unapplied changes';

  return (
    <>
      {linked.length ? (
        // Keyed by page, so switching stories starts on the right page.
        <AppShell key={pageId} args={args} initialId={linked[0].id} pagesConfig={data} />
      ) : (
        <StandalonePage pageId={pageId} theme={theme} />
      )}
      <form
        style={panel}
        data-onebit-ignore=""
        aria-label="Page setup"
        onSubmit={(e) => {
          e.preventDefault();
          if (!blocked) apply();
        }}
      >
        <strong style={{ fontSize: 14 }}>{pageLabel(pageId, menu, data)} page</strong>
        <label style={field}>
          <span style={hint}>Theme</span>
          <select value={page.theme} onChange={(e) => set('theme')(e.target.value)} style={control}>
            {THEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label style={field}>
          <span style={hint}>Name when not in the top navigation</span>
          <input value={page.name} maxLength={MAX_PAGE_NAME} onChange={(e) => set('name')(e.target.value)} style={control} />
        </label>
        <span style={hint}>
          {linked.length
            ? `Opened by: ${linked.map((item) => item.label).join(', ')} (Components/Top navigation).`
            : 'Not in the top navigation. The page is kept and can be linked again.'}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button type="submit" disabled={!dirty || blocked || status.state === 'saving'} style={{ ...button, background: '#111827', color: '#fff', opacity: dirty && !blocked ? 1 : 0.4 }}>
            Apply
          </button>
          <button type="button" disabled={!dirty} onClick={reset} style={{ ...button, background: '#fff', color: '#111827', opacity: dirty ? 1 : 0.4 }}>
            Reset
          </button>
        </div>
        {message && (
          <span role="status" style={{ fontSize: 12, color: blocked || status.state === 'error' ? '#dc2626' : dirty ? '#b45309' : '#15803d' }}>
            {message}
          </span>
        )}
      </form>
    </>
  );
}
