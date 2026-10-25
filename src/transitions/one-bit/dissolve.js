// Pixel painting for the 1-bit layer. Every function writes RGBA pixels as
// Uint32 (little-endian, so 0xAABBGGRR) into a buffer that is reused each frame.

import { bayerStep } from './bayer.js';

export const BLACK = 0xff000000;
export const WHITE = 0xffffffff;
export const CLEAR = 0;

/** Opaque gray as a pixel, v in 0–255. */
export const gray = (v) => {
  const c = Math.round(Math.min(255, Math.max(0, v)));
  return (0xff000000 | (c << 16) | (c << 8) | c) >>> 0;
};

/** Small seeded PRNG (mulberry32). Same seed → same sequence. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One random threshold in [0, 1) per pixel, stable for a given seed. */
export function makeThresholds(count, seed) {
  const random = mulberry32(seed);
  const thresholds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) thresholds[i] = random();
  return thresholds;
}

/** The whole 1-bit image (bits: 1 = black ink, 0 = white paper). */
export function paintBits(bits, inverted, out = new Uint32Array(bits.length)) {
  const ink = inverted ? WHITE : BLACK;
  const paper = inverted ? BLACK : WHITE;
  for (let i = 0; i < bits.length; i += 1) out[i] = bits[i] ? ink : paper;
  return out;
}

/** The 1-bit image where the Bayer mask is on, clear elsewhere. */
export function paintBayer(bits, levels, progress, inverted, out = new Uint32Array(bits.length)) {
  const step = bayerStep(progress);
  const ink = inverted ? WHITE : BLACK;
  const paper = inverted ? BLACK : WHITE;
  for (let i = 0; i < bits.length; i += 1) out[i] = levels[i] < step ? (bits[i] ? ink : paper) : CLEAR;
  return out;
}

/**
 * Splits a 1-bit image into background and content: the content is every
 * pixel that differs from the page's background. Pass the background tone
 * (0 dark, 255 light) when known; otherwise the value most pixels have is used.
 * @returns {{ content: Uint8Array, background: number, foreground: number }} background/foreground as 0 or 255
 */
export function contentOf(bits, tone) {
  let darkPage;
  if (tone === 0 || tone === 255) darkPage = tone === 0;
  else {
    let ink = 0;
    for (let i = 0; i < bits.length; i += 1) ink += bits[i];
    darkPage = ink * 2 > bits.length;
  }
  const content = new Uint8Array(bits.length);
  for (let i = 0; i < bits.length; i += 1) content[i] = darkPage ? 1 - bits[i] : bits[i];
  return { content, background: darkPage ? 0 : 255, foreground: darkPage ? 255 : 0 };
}

/**
 * Background level (0 = the source's, 1 = the destination's) across the content
 * switch. One smooth ease over 'out' and 'in' together, so it never jumps.
 * @param {'out'|'in'} phase
 * @param {number} t progress through that phase
 * @param {number} outShare out's share of out + in (by duration)
 */
export function backgroundMix(phase, t, outShare = 0.5) {
  const u = phase === 'out' ? t * outShare : outShare + t * (1 - outShare);
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
}

/**
 * One frame of the content switch: the background as given, plus the content
 * pixels that are showing. Leaving content shows while its threshold is at or
 * above progress (all at 0, none at 1); arriving content shows once progress
 * passes its threshold (none at 0, all at 1).
 * @param {{ content: Uint8Array, foreground: number }} page from contentOf
 * @param {number} background gray level 0–255
 * @param {boolean} arriving
 */
export function paintSwitch(page, background, thresholds, progress, arriving, out = new Uint32Array(thresholds.length)) {
  const bg = gray(background);
  const fg = gray(page.foreground);
  const { content } = page;
  for (let i = 0; i < thresholds.length; i += 1) {
    const showing = content[i] && (arriving ? thresholds[i] < progress : thresholds[i] >= progress);
    out[i] = showing ? fg : bg;
  }
  return out;
}

/**
 * Dissolve to see-through: a pixel keeps showing while its threshold is at or
 * above progress. Kept for callers that composite over something else.
 */
export function dissolve(bits, thresholds, progress, inverted, out = new Uint32Array(thresholds.length)) {
  const ink = inverted ? WHITE : BLACK;
  const paper = inverted ? BLACK : WHITE;
  for (let i = 0; i < thresholds.length; i += 1) {
    out[i] = thresholds[i] >= progress ? (bits ? (bits[i] ? ink : paper) : BLACK) : CLEAR;
  }
  return out;
}
