// React adapter: the app's "router" is the active top-menu id held in state.
// This hook owns that state, decides which transition to play from the menu
// config (item.transition; see registry.js), and lets the core swap the page under the overlay
// by calling commit(). Pages themselves are never touched.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createOneBitTransition, prefersReducedMotion } from './one-bit/oneBitTransition.js';
import { resolveOptions } from './one-bit/options.js';
import { isOneBit, pickTransition } from './transitionRules.js';
import './one-bit/one-bit.css';

const HISTORY_KEY = 'pageTransition';

// Adds a history entry for the page, unless the URL already shows it.
function pushPage(id) {
  if (window.location.hash === `#${id}`) return;
  window.history.pushState({ ...window.history.state, [HISTORY_KEY]: id }, '', `#${id}`);
}

function idFromHash(items) {
  const id = decodeURIComponent(window.location.hash.slice(1));
  return items.some((item) => item.id === id) ? id : null;
}

function focusDestination(main, mode) {
  if (!main || mode === 'none') return;
  const target = (mode === 'heading' && main.querySelector('h1, h2')) || main;
  if (!target.hasAttribute('tabindex') && !target.matches('a[href], button, input, select, textarea')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

/**
 * @param {object} config
 * @param {Array<{ id: string, label: string, page: string, transition: string }>} config.items  top-navigation items
 * @param {string} [config.initialId]
 * @param {object} [config.options]        transition options (see one-bit/options.js)
 * @param {boolean} [config.syncHistory]   mirror the page in the URL hash so back/forward work
 * @param {{ current: HTMLElement | null }} config.mainRef  the page's <main>
 */
export function usePageTransitions({ items, initialId, options, syncHistory = false, mainRef }) {
  const resolved = resolveOptions(options);
  const itemsRef = useRef(items);
  const optionsRef = useRef(resolved);
  useLayoutEffect(() => {
    itemsRef.current = items;
    optionsRef.current = resolved;
  });

  const [activeId, setActiveId] = useState(
    () => (syncHistory && idFromHash(items)) || (items.some((item) => item.id === initialId) ? initialId : items[0]?.id),
  );
  const [entrance, setEntrance] = useState('idle');
  const [announcement, setAnnouncement] = useState('');
  const activeRef = useRef(activeId);
  const engineRef = useRef(null);
  const runRef = useRef(null);
  const queueRef = useRef(null);
  const navigateRef = useRef(null);

  const navigate = useCallback(
    (to, { history: historyMode = 'push', animate = true, entrance: forcedEntrance } = {}) => {
      const list = itemsRef.current;
      const opts = optionsRef.current;
      const target = list.find((item) => item.id === to);
      if (!target) return;

      if (runRef.current) {
        if (runRef.current.to === to) {
          // The latest choice is where we're already going: forget anything queued.
          queueRef.current = null;
          if (syncHistory && historyMode === 'push') pushPage(to);
          return;
        }
        // Back/forward always gets handled, so the page never disagrees with the URL.
        const policy = historyMode === 'none' && opts.duringTransition === 'ignore' ? 'queue' : opts.duringTransition;
        if (policy === 'ignore') return;
        if (policy === 'queue') {
          queueRef.current = { to, history: 'none' };
          if (syncHistory && historyMode === 'push') pushPage(to);
          return;
        }
        runRef.current = null;
        engineRef.current?.cancel(); // 'cancel': jump to the end of the current one, then start this one
      }

      const fromId = activeRef.current;
      if (to === fromId) return;
      if (syncHistory && historyMode === 'push') pushPage(to);

      const from = list.find((item) => item.id === fromId);
      const mode = animate ? pickTransition(from, target, opts) : 'none';
      const animated = mode !== 'none' && !(prefersReducedMotion(opts.reducedMotion) && opts.reducedMotionMode === 'instant');
      const plays = animated && isOneBit(target) && opts.entrance !== 'none' && !prefersReducedMotion(opts.reducedMotion);
      const nextEntrance = forcedEntrance ?? (plays ? 'pending' : 'idle');
      const commit = () => {
        flushSync(() => {
          setActiveId(to);
          setEntrance(nextEntrance);
        });
        activeRef.current = to;
      };

      if (mode === 'none') {
        commit();
        setAnnouncement(target.label);
        return;
      }

      const token = {};
      runRef.current = { to, token };
      const main = mainRef.current;
      main?.setAttribute('aria-busy', 'true');
      const engine = createOneBitTransition(opts);
      engineRef.current = engine;
      engine
        .play(mode, { root: document.body, commit, incomingRoot: () => mainRef.current })
        .then((result) => {
          if (runRef.current?.token !== token) return; // superseded by a newer navigation
          runRef.current = null;
          mainRef.current?.removeAttribute('aria-busy');
          if (nextEntrance === 'pending') setEntrance(result.cancelled ? 'idle' : 'play');
          if (!result.cancelled) focusDestination(mainRef.current, opts.focus);
          setAnnouncement(target.label);
          window.dispatchEvent(new CustomEvent('pagetransition:finished', { detail: { from: fromId, to, ...result } }));
          const queued = queueRef.current;
          queueRef.current = null;
          if (queued && queued.to !== activeRef.current) navigateRef.current(queued.to, queued);
        });
    },
    [mainRef, syncHistory],
  );
  useLayoutEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // Back/forward and in-page #links.
  useEffect(() => {
    if (!syncHistory) return undefined;
    window.history.replaceState({ ...window.history.state, [HISTORY_KEY]: activeRef.current }, '');
    const onPopState = (event) => {
      const id = event.state?.[HISTORY_KEY] ?? idFromHash(itemsRef.current);
      if (id && (id !== activeRef.current || runRef.current)) navigateRef.current(id, { history: 'none' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [syncHistory]);

  useEffect(() => () => engineRef.current?.cancel(), []);

  const mainProps = {
    'data-onebit-entrance': entrance,
    style: { '--onebit-entrance-duration': `${resolved.entranceDuration}ms`, '--onebit-entrance-steps': resolved.entranceSteps },
  };

  return { activeId, navigate, entrance, announcement, mainProps };
}
