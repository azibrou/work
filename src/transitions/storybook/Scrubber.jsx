import { useEffect, useRef, useState } from 'react';
import menu from '../../components/top-menu/menu.json';
import { createOneBitTransition, waitForIncoming } from '../one-bit/oneBitTransition.js';
import { frameAtProgress } from '../one-bit/timeline.js';
import { isOneBit, withOneBit } from '../transitionRules.js';
import { AppShell } from './AppShell.jsx';
import { argsToOptions, transitionArgs } from './controls.js';

const panel = {
  position: 'fixed',
  left: 12,
  right: 12,
  bottom: 12,
  zIndex: 2147483600, // above the overlay
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  background: '#fff',
  color: '#111',
  border: '1px solid #111',
  borderRadius: 8,
  font: '12px "Roboto Mono", monospace',
};

// From/to menu items for a mode, given which items are 1-bit.
function routeFor(mode, items) {
  const oneBit = items.filter(isOneBit).map((item) => item.id);
  const plain = items.filter((item) => !isOneBit(item)).map((item) => item.id);
  if (mode === 'reverse') return [oneBit[0], plain[0]];
  if (mode === 'between 1-bit pages') return [oneBit[0], oneBit[1]];
  return [plain[0], oneBit[0]];
}

/**
 * Captures the real "from" and "to" pages once, then renders whichever frame
 * the slider points at. Same seed and options → same frame, every time.
 */
export function Scrubber({ args }) {
  const all = { ...transitionArgs, ...args };
  const mode = all.mode ?? 'forward';
  const items = withOneBit(menu.items, all.oneBitItems);
  const [fromId, toId] = routeFor(mode, items);
  const controllerRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState({ arg: args.progress, value: args.progress ?? 0 });
  // The progress control resets the slider; the slider itself is local.
  if (args.progress !== progress.arg) setProgress({ arg: args.progress, value: args.progress ?? 0 });

  // Everything that shapes the frames; a change means capturing again.
  const config = JSON.stringify({
    options: { ...argsToOptions(all), reducedMotion: 'no-preference' },
    mode,
    fromId,
    toId,
    toIsOneBit: isOneBit(items.find((item) => item.id === toId)),
  });

  useEffect(() => {
    const { options, mode: playMode, fromId: from, toId: to, toIsOneBit } = JSON.parse(config);
    if (!from || !to) return undefined;
    let stale = false;
    let created = null;
    (async () => {
      // Out of the effect's synchronous part: navigate() flushes a React render.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (stale) return;
      const controller = controllerRef.current;
      const engine = createOneBitTransition(options);
      const settle = () => waitForIncoming({ incomingRoot: () => document.querySelector('main') }, engine.options, { width: innerWidth, height: innerHeight });

      controller.navigate(to, { animate: false, history: 'none', entrance: toIsOneBit && options.entrance !== 'none' ? 'pending' : 'idle' });
      await settle();
      const incoming = await engine.capture();
      controller.navigate(from, { animate: false, history: 'none' });
      await settle();
      const outgoing = await engine.capture();
      if (stale) return;
      const t0 = performance.now();
      created = engine.preview({ outgoing, incoming, mode: playMode });
      const ditherMs = performance.now() - t0;
      setPreview({
        engine: created,
        stats: `capture ${outgoing.ms.toFixed(0)} ms · dither + setup ${ditherMs.toFixed(0)} ms · ${outgoing.width}×${outgoing.height} @${outgoing.dpr}x`,
      });
    })();
    return () => {
      stale = true;
      created?.destroy();
      setPreview(null);
    };
  }, [config]);

  useEffect(() => {
    preview?.engine.renderAt(progress.value);
  }, [preview, progress.value]);

  const missing = !fromId || !toId;
  const frame = preview ? frameAtProgress(preview.engine.timeline, progress.value) : null;
  const total = preview?.engine.timeline.total ?? 0;
  let status = preview?.stats ?? 'Capturing…';
  if (missing) status = `"${mode}" needs ${mode === 'between 1-bit pages' ? 'two 1-bit items' : 'one 1-bit item and one plain item'}.`;

  return (
    <>
      <AppShell args={all} initialId={fromId} controllerRef={controllerRef} showToolbar={false} />
      <div style={panel} data-onebit-ignore="">
        <strong>
          {mode}: {fromId ?? '–'} → {toId ?? '–'}
        </strong>
        <input
          type="range"
          aria-label="Transition progress"
          min={0}
          max={1}
          step={0.001}
          value={progress.value}
          onChange={(e) => setProgress({ arg: args.progress, value: Number(e.target.value) })}
          disabled={!preview}
        />
        <span style={{ minWidth: 220, textAlign: 'right' }}>
          {frame ? `${frame.name} ${(frame.t * 100).toFixed(0)}% · ${Math.round(progress.value * total)} / ${total} ms` : '—'}
        </span>
        <span style={{ gridColumn: '1 / -1', color: '#555' }}>{status}</span>
      </div>
    </>
  );
}
