import { useRef } from 'react';
import App from '../../App.jsx';
import menu from '../../components/top-menu/menu.json';
import Page from '../../pages/Page.jsx';
import { isOneBit, withOneBit } from '../transitionRules.js';
import { argsToOptions, transitionArgs } from './controls.js';
import { useMainStyles } from './useMainStyles.js';

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

const toolbar = {
  position: 'fixed',
  left: 12,
  bottom: 12,
  zIndex: 10,
  display: 'flex',
  gap: 6,
  padding: 6,
  background: '#fff',
  color: '#111',
  colorScheme: 'light',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  font: '600 12px Inter, sans-serif',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};
const toolButton = { font: 'inherit', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', color: '#111', cursor: 'pointer' };

/**
 * The real app (top menu + page + transitions) with its menu config and
 * transition options taken from story args.
 *   pages: { [pageId]: () => ReactNode } replaces those pages
 *   pagesConfig: pages.json contents (themes), for previewing unapplied changes
 */
export function AppShell({ args = {}, initialId, pages = {}, pagesConfig, controllerRef: externalRef, showToolbar = true }) {
  useMainStyles();
  const ownRef = useRef(null);
  const controllerRef = externalRef ?? ownRef;
  const all = { ...transitionArgs, ...args };
  const items = withOneBit(menu.items, all.oneBitItems);
  const options = argsToOptions(all);

  const oneBit = items.filter(isOneBit).map((item) => item.id);
  const plain = items.filter((item) => !isOneBit(item)).map((item) => item.id);

  // Puts the app on `from` without a transition, then navigates to `to` as a menu click would.
  const play = async (from, to) => {
    const controller = controllerRef.current;
    if (!controller || !from || !to) return;
    controller.navigate(from, { animate: false, history: 'none' });
    await nextFrame();
    await nextFrame();
    controller.navigate(to);
  };

  return (
    <>
      <App
        items={items}
        {...(pagesConfig ? { pages: pagesConfig } : {})}
        initialId={initialId}
        transitionOptions={options}
        syncHistory={all.syncHistory}
        controllerRef={controllerRef}
        renderPage={(pageId) => (pages[pageId] ? pages[pageId]() : <Page id={pageId} />)}
      />
      {showToolbar && (
        <div style={toolbar} data-onebit-ignore="">
          <button type="button" style={toolButton} disabled={!oneBit.length || !plain.length} onClick={() => play(plain[0], oneBit[0])}>
            ▶ Play forward
          </button>
          <button type="button" style={toolButton} disabled={!oneBit.length || !plain.length} onClick={() => play(oneBit[0], plain[0])}>
            ◀ Play reverse
          </button>
          <button type="button" style={toolButton} disabled={oneBit.length < 2} onClick={() => play(oneBit[0], oneBit[1])}>
            1-bit → 1-bit
          </button>
        </div>
      )}
    </>
  );
}
