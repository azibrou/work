// "1-bit desktop" page transition. Framework-agnostic: it knows nothing about
// React or routing. The caller hands it a context with a commit() that swaps
// the page, and the transition calls it when the overlay covers the screen.
//
// Both pages go through the same transform: the source is dithered to 1-bit
// (Atkinson, revealed through a Bayer mask), and the destination is captured,
// dithered the same way, and un-dithered back to the live page through the
// same mask. Reverse plays the timeline backwards.

import { atkinson } from './atkinson.js';
import { bayerLevels } from './bayer.js';
import { makeThresholds } from './dissolve.js';
import { resolveOptions } from './options.js';
import { pageBackground, rasterize as defaultRasterize } from './rasterize.js';
import { createRenderer } from './render.js';
import { buildTimeline, frameAt, frameAtProgress } from './timeline.js';

const MAX_FRAME_STEP = 50; // ms; a long frame never skips a whole short phase
const SCROLL_KEYS = new Set([' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']);

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const withTimeout = (promise, ms) => Promise.race([Promise.resolve(promise).catch(() => {}), delay(ms)]);

export function readViewport(maxDpr = 2) {
  const el = document.documentElement;
  return { width: el.clientWidth, height: el.clientHeight, dpr: Math.min(maxDpr, window.devicePixelRatio || 1) };
}

export function prefersReducedMotion(setting = 'system') {
  if (setting === 'reduce') return true;
  if (setting === 'no-preference') return false;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isEditable(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

/** Downsamples a capture to the 1-bit grid on the GPU, then dithers it. */
export function toOneBit(capture, pixelSize) {
  const width = Math.ceil(capture.width / pixelSize);
  const height = Math.ceil(capture.height / pixelSize);
  const small = document.createElement('canvas');
  small.width = width;
  small.height = height;
  const ctx = small.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(capture.canvas, 0, 0, capture.width / pixelSize, capture.height / pixelSize);
  return atkinson(ctx.getImageData(0, 0, width, height), 1);
}

/** 0 for a dark background colour, 255 for a light one (luma threshold 128, like the dither). */
export function toneOf(color) {
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = color || '#fff';
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return 0.3 * r + 0.59 * g + 0.11 * b < 128 ? 0 : 255;
}

function buildAssets({ viewport, options, mode, first = null, second = null, tones = {} }) {
  const ps = options.pixelSize;
  const grid = { width: Math.ceil(viewport.width / ps), height: Math.ceil(viewport.height / ps) };
  return {
    viewport,
    grid,
    mode,
    pixelSize: ps,
    first: first?.bits ?? null,
    second: second?.bits ?? null,
    tones,
    outShare: options.durations.out / (options.durations.out + options.durations.in || 1),
    levels: bayerLevels(grid.width, grid.height, options.bayerCell / ps),
    thresholds: makeThresholds(grid.width * grid.height, options.seed),
    underlays: {},
    live: {},
  };
}

function createOverlay(viewport, zIndex) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width * viewport.dpr);
  canvas.height = Math.round(viewport.height * viewport.dpr);
  canvas.setAttribute('data-onebit-ignore', '');
  canvas.setAttribute('aria-hidden', 'true');
  // Fixed at the size it started with: a resize mid-transition finishes at the
  // old size, then the overlay goes and the live page is already right.
  Object.assign(canvas.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: `${viewport.width}px`,
    height: `${viewport.height}px`,
    zIndex: String(zIndex),
    pointerEvents: 'none',
    display: 'block',
  });
  document.body.appendChild(canvas);
  return canvas;
}

async function imagesReady(root, viewport) {
  const pending = [...root.querySelectorAll('img')].filter((img) => {
    if (img.complete) return false;
    const r = img.getBoundingClientRect();
    return r.bottom > 0 && r.top < viewport.height && r.right > 0 && r.left < viewport.width;
  });
  await Promise.all(
    pending.map(
      (img) =>
        new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        }),
    ),
  );
}

// Pages can mark themselves not ready with data-onebit-pending (e.g. while data loads).
async function pendingCleared(root, deadline) {
  while (root.querySelector('[data-onebit-pending]') && performance.now() < deadline) await nextFrame();
}

/**
 * Waits for the incoming page: mounted, fonts loaded, visible images loaded
 * (up to imageTimeout, then it goes ahead with whatever is painted).
 */
export async function waitForIncoming(context, options, viewport) {
  await nextFrame();
  const root = (await context.incomingRoot?.()) ?? context.root ?? document.body;
  const deadline = performance.now() + options.imageTimeout;
  await Promise.all([
    withTimeout(document.fonts?.ready, options.fontTimeout),
    withTimeout(Promise.all([imagesReady(root, viewport), pendingCleared(root, deadline)]), options.imageTimeout),
  ]);
  await nextFrame();
}

/**
 * @typedef {object} TransitionContext
 * @property {() => void} commit           swaps the page; called once, under the overlay
 * @property {Element} [root]              what gets captured (default document.body)
 * @property {() => Element | Promise<Element>} [incomingRoot]  the new page's root, after commit
 * @property {{ width:number, height:number, dpr:number }} [viewport]
 */

/**
 * @param {Partial<typeof import('./options.js').DEFAULT_OPTIONS>} [userOptions]
 */
export function createOneBitTransition(userOptions) {
  const options = resolveOptions(userOptions);
  let active = null;

  const capture = (viewport = readViewport(options.maxDpr), root = document.body) => {
    if (!options.rasterize) return defaultRasterize(root, viewport, options);
    return Promise.resolve(options.rasterize(root, viewport)).then((canvas) => ({ canvas, ...viewport, ms: 0, tainted: 0 }));
  };

  function startRun(requestedMode, context) {
    let resolveDone;
    const promise = new Promise((resolve) => {
      resolveDone = resolve;
    });
    const state = { done: false, committed: false, raf: 0, overlay: null, mode: requestedMode, stats: {} };
    const cleanups = [];

    const commit = () => {
      if (state.committed) return;
      state.committed = true;
      context.commit?.();
      if (options.scrollReset === 'top') window.scrollTo(0, 0);
    };
    const finish = (extra = {}) => {
      if (state.done) return;
      state.done = true;
      cancelAnimationFrame(state.raf);
      for (const fn of cleanups) fn();
      state.overlay?.remove();
      resolveDone({ mode: state.mode, cancelled: false, stats: state.stats, ...extra });
    };
    const cancel = () => {
      if (state.done) return;
      commit();
      finish({ cancelled: true });
    };
    const fail = (error) => {
      console.error('[one-bit] transition failed; showing the page without it', error);
      commit();
      finish({ error });
    };

    const listen = (target, type, handler, opts) => {
      target.addEventListener(type, handler, opts);
      cleanups.push(() => target.removeEventListener(type, handler, opts));
    };
    listen(window, 'keydown', (event) => {
      if (event.key === 'Escape' && options.cancelOnEscape) cancel();
      else if (SCROLL_KEYS.has(event.key) && !isEditable(event.target)) event.preventDefault();
    });
    const block = (event) => event.preventDefault();
    listen(window, 'wheel', block, { passive: false });
    listen(window, 'touchmove', block, { passive: false });

    // After the swap, onCommit runs at once (in the same frame) and
    // prepareIncoming waits for the new page and hands its 1-bit image to the
    // renderer. The timeline holds at gateAt until that is done.
    const animate = (timeline, renderer, prepareIncoming, onCommit) => {
      let elapsed = 0;
      let last = null;
      let gateOpen = !prepareIncoming;
      const tick = (now) => {
        if (state.done) return;
        try {
          if (last === null) last = now;
          elapsed += Math.min(now - last, MAX_FRAME_STEP);
          last = now;
          if (!state.committed && elapsed >= timeline.commitAt) {
            commit();
            onCommit?.();
            if (prepareIncoming) {
              prepareIncoming().then(() => {
                gateOpen = true;
              }, fail);
            }
          }
          if (!gateOpen && elapsed > timeline.gateAt) elapsed = timeline.gateAt;
          renderer.draw(frameAt(timeline, elapsed));
          if (elapsed >= timeline.total) {
            finish();
            return;
          }
          state.raf = requestAnimationFrame(tick);
        } catch (error) {
          fail(error);
        }
      };
      state.raf = requestAnimationFrame(tick);
    };

    (async () => {
      const viewport = context.viewport ?? readViewport(options.maxDpr);
      if (prefersReducedMotion(options.reducedMotion)) state.mode = options.reducedMotionMode === 'instant' ? 'instant' : 'crossfade';
      const { mode } = state;
      if (mode === 'instant') {
        commit();
        finish();
        return;
      }

      await withTimeout(document.fonts?.ready, options.fontTimeout);
      if (state.done) return;
      const t0 = performance.now();
      const outgoing = await capture(viewport, context.root);
      if (state.done) return;
      state.stats.captureMs = outgoing.ms;
      state.stats.tainted = outgoing.tainted;
      const overlay = (state.overlay = createOverlay(viewport, options.zIndex));
      const timeline = buildTimeline(options.durations, mode);

      if (mode !== 'crossfade') {
        // The source's 1-bit image now; the destination's once it has swapped in.
        // In forward terms the source is 'first' going forward and 'second' going back.
        const sourceSlot = mode === 'reverse' ? 'second' : 'first';
        const destinationSlot = mode === 'reverse' ? 'first' : 'second';
        const d0 = performance.now();
        const source = toOneBit(outgoing, options.pixelSize);
        state.stats.ditherMs = performance.now() - d0;
        const assets = buildAssets({ viewport, options, mode, [sourceSlot]: source, tones: { [sourceSlot]: toneOf(outgoing.background) } });
        state.stats.prepareMs = performance.now() - t0;
        const renderer = createRenderer(overlay, assets);
        // The new page's background is known the moment it swaps in, so the
        // background fade has both ends before its content is captured.
        const onCommit = () => renderer.setTone(destinationSlot, toneOf(pageBackground()));
        const prepareIncoming = async () => {
          await waitForIncoming(context, options, viewport);
          if (state.done) return;
          const incoming = await capture(viewport, context.root);
          if (state.done) return;
          state.stats.captureMs += incoming.ms;
          renderer.setImage(destinationSlot, toOneBit(incoming, options.pixelSize).bits);
        };
        animate(timeline, renderer, prepareIncoming, onCommit);
        return;
      }

      // Crossfade (reduced motion): cover the screen with a pixel-aligned
      // picture of the current page, swap the page underneath, and fade it out.
      overlay.getContext('2d').drawImage(outgoing.canvas, 0, 0);
      commit();
      await waitForIncoming(context, options, viewport);
      if (state.done) return;
      const assets = buildAssets({ viewport, options, mode });
      assets.underlays = { fade: outgoing };
      state.stats.prepareMs = performance.now() - t0;
      animate(timeline, createRenderer(overlay, assets), null);
    })().catch(fail);

    return { promise, cancel };
  }

  /**
   * Plays a transition. Resolves when the overlay is gone and the new page is live.
   * @param {'forward'|'reverse'|'crossfade'|'instant'} mode
   * @param {TransitionContext} context
   * @returns {Promise<{ mode: string, cancelled: boolean, error?: Error, stats: object }>}
   */
  function play(mode, context) {
    active?.cancel();
    const run = startRun(mode, context);
    active = run;
    run.promise.then(() => {
      if (active === run) active = null;
    });
    return run.promise;
  }

  /**
   * Renders any frame from two captures, without playing. Used by the scrubber.
   * @param {{ outgoing: object, incoming: object, mode?: string, canvas?: HTMLCanvasElement }} input
   */
  function preview({ outgoing, incoming, mode = 'forward', canvas = null }) {
    const viewport = { width: outgoing.width, height: outgoing.height, dpr: outgoing.dpr };
    let assets;
    if (mode !== 'crossfade') {
      const source = toOneBit(outgoing, options.pixelSize);
      const destination = toOneBit(incoming, options.pixelSize);
      const tone = { source: toneOf(outgoing.background), destination: toneOf(incoming.background) };
      const [first, second] = mode === 'reverse' ? [destination, source] : [source, destination];
      const tones = mode === 'reverse' ? { first: tone.destination, second: tone.source } : { first: tone.source, second: tone.destination };
      assets = buildAssets({ viewport, options, mode, first, second, tones });
      // Where the overlay is see-through, the live page shows: in forward terms,
      // the page being left during 'dither' and the page arrived at during 'undither'.
      assets.live = mode === 'reverse' ? { dither: incoming, undither: outgoing } : { dither: outgoing, undither: incoming };
    } else {
      assets = buildAssets({ viewport, options, mode });
      assets.underlays = { fade: outgoing };
      assets.live = { fade: incoming };
    }
    const target = canvas ?? createOverlay(viewport, options.zIndex);
    const renderer = createRenderer(target, assets);
    const timeline = buildTimeline(options.durations, mode);
    return {
      timeline,
      canvas: target,
      renderAt(progress) {
        const frame = frameAtProgress(timeline, progress);
        renderer.draw(frame);
        return frame;
      },
      destroy() {
        if (!canvas) target.remove();
      },
    };
  }

  return {
    options,
    play,
    enter: (context) => play('forward', context),
    exit: (context) => play('reverse', context),
    cancel: () => active?.cancel(),
    get busy() {
      return active !== null;
    },
    capture,
    preview,
  };
}
