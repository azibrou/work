// Every option of the 1-bit desktop transition, with its default.
// The README lists the same table; keep them in step.

export const DEFAULT_OPTIONS = Object.freeze({
  durations: Object.freeze({
    dither: 450, // the page being left flips to 1-bit through a Bayer mask
    out: 500, // its content disappears pixel by pixel; the background starts its fade
    in: 500, // the new content appears pixel by pixel; the background finishes its fade
    undither: 450, // the new page flips from 1-bit to live through the same mask
    crossfade: 150, // reduced-motion crossfade
  }),
  pixelSize: 2, // CSS px per 1-bit pixel (1–4)
  bayerCell: 10, // CSS px per Bayer mask cell
  seed: 1984, // order pixels disappear and appear in
  maxDpr: 2,
  reducedMotion: 'system', // 'system' | 'reduce' (force) | 'no-preference' (ignore the OS setting)
  reducedMotionMode: 'crossfade', // 'crossfade' | 'instant'
  oneBitToOneBit: 'forward', // between two 1-bit pages: 'forward' (the same transition) | 'none'
  duringTransition: 'queue', // a new navigation mid-transition: 'queue' (latest wins) | 'ignore' | 'cancel'
  cancelOnEscape: true,
  imageTimeout: 400, // ms to wait for the destination's images
  fontTimeout: 2000, // ms to wait for web fonts
  scrollReset: 'top', // 'top' | 'preserve', applied under the overlay when the route swaps
  ignoreSelector: '[data-onebit-ignore]', // elements left out of the capture
  placeholderColor: '#808080', // drawn instead of cross-origin images that would taint the canvas
  zIndex: 2147483000,
  rasterize: null, // optional custom capture: async (root, viewport) => HTMLCanvasElement
  // Used by the page adapter (usePageTransitions), not the core:
  entrance: 'none', // extra destination entrance after the transition: 'none' | 'lines' (terminal-style wipe)
  entranceDuration: 700,
  entranceSteps: 14,
  focus: 'heading', // after a transition: 'heading' | 'main' | 'none'
});

const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Defaults merged with overrides, numbers clamped to sane ranges. */
export function resolveOptions(overrides = {}) {
  const o = { ...DEFAULT_OPTIONS, ...overrides, durations: { ...DEFAULT_OPTIONS.durations, ...overrides.durations } };
  for (const key of Object.keys(o.durations)) o.durations[key] = clamp(o.durations[key], 0, 10000, DEFAULT_OPTIONS.durations[key]);
  o.pixelSize = Math.round(clamp(o.pixelSize, 1, 4, 2));
  o.bayerCell = clamp(o.bayerCell, 1, 200, 10);
  o.seed = Math.round(clamp(o.seed, 0, 2 ** 32 - 1, 1984));
  o.maxDpr = clamp(o.maxDpr, 1, 4, 2);
  return o;
}
