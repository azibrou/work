import { describe, expect, it } from 'vitest';
import { atkinson, toGray } from '../src/transitions/one-bit/atkinson.js';
import { bayerLevel, bayerLevels, bayerMask, bayerStep } from '../src/transitions/one-bit/bayer.js';
import { buildTimeline, frameAt, frameAtProgress } from '../src/transitions/one-bit/timeline.js';
import { BLACK, CLEAR, WHITE, backgroundMix, contentOf, dissolve, gray, makeThresholds, paintBayer, paintBits, paintSwitch } from '../src/transitions/one-bit/dissolve.js';
import { DEFAULT_OPTIONS, resolveOptions } from '../src/transitions/one-bit/options.js';
import { parseGradient, splitTopLevel, fitRect } from '../src/transitions/one-bit/rasterize.js';
import { pickTransition, withOneBit } from '../src/transitions/transitionRules.js';

// ImageData-like fixture from gray values (or [r,g,b,a] tuples).
function image(width, height, values) {
  const data = new Uint8ClampedArray(width * height * 4);
  values.forEach((v, i) => {
    const [r, g, b, a] = Array.isArray(v) ? v : [v, v, v, 255];
    data.set([r, g, b, a ?? 255], i * 4);
  });
  return { data, width, height };
}

describe('atkinson', () => {
  it('uses 0.3 / 0.59 / 0.11 luma and a 128 threshold', () => {
    // red 76.5 → ink, green 150.45 → paper, blue 28.05 → ink. Each is far enough
    // from 128 that the diffused error can't flip the next one.
    const { gray } = toGray(image(3, 1, [[255, 0, 0], [0, 255, 0], [0, 0, 255]]));
    expect([...gray].map((v) => Math.round(v * 100) / 100)).toEqual([76.5, 150.45, 28.05]);
    expect([...atkinson(image(1, 1, [127])).bits]).toEqual([1]);
    expect([...atkinson(image(1, 1, [128])).bits]).toEqual([0]);
  });

  it('treats transparent pixels as white', () => {
    expect([...atkinson(image(1, 1, [[0, 0, 0, 0]])).bits]).toEqual([0]);
  });

  it('diffuses 1/8 of the error to the next two pixels on the row', () => {
    // 120 → ink (+15 to x1, x2), 135 → paper (−15 to x2), 120 → ink
    expect([...atkinson(image(3, 1, [120, 120, 120])).bits]).toEqual([1, 0, 1]);
    // 100 → ink (+12.5), 112.5 → ink (+14.0625), 126.5625 → ink
    expect([...atkinson(image(3, 1, [100, 100, 100])).bits]).toEqual([1, 1, 1]);
  });

  it('matches a hand-computed 2×2 golden', () => {
    // (0,0) 128 paper, −15.875 to (1,0) (0,1) (1,1)
    // (1,0) 112.125 ink, +14.015625 to (0,1) (1,1)
    // (0,1) 126.140625 ink, +15.767578125 to (1,1)
    // (1,1) 141.908203125 paper
    expect([...atkinson(image(2, 2, [128, 128, 128, 128])).bits]).toEqual([0, 1, 1, 0]);
  });

  it('spreads to the six Atkinson neighbours only (6/8 of the error)', () => {
    // A 64 at (1,1) in a 255 field. The only ink pixel is (1,1). The first
    // paper pixels after it carry exactly +8 each, so their gray is 263 → share 1.
    const values = new Array(16).fill(255);
    values[5] = 64;
    const { bits } = atkinson(image(4, 4, values));
    expect([...bits]).toEqual([0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('downsamples by pixelSize with a box average', () => {
    const { gray, width, height } = toGray(image(4, 2, [0, 255, 255, 255, 255, 255, 255, 255]), 2);
    expect([width, height]).toEqual([2, 1]);
    expect([...gray]).toEqual([191.25, 255]);
    expect(atkinson(image(5, 3, new Array(15).fill(0)), 2)).toMatchObject({ width: 3, height: 2 });
  });
});

describe('bayer', () => {
  it('uses the standard 4×4 matrix and wraps', () => {
    expect([bayerLevel(0, 0), bayerLevel(1, 0), bayerLevel(0, 1), bayerLevel(3, 3), bayerLevel(4, 4), bayerLevel(5, 2)]).toEqual([0, 8, 12, 5, 0, 11]);
  });

  it('maps progress to 0–16 ranks', () => {
    expect([bayerStep(0), bayerStep(0.5), bayerStep(1), bayerStep(-1), bayerStep(2)]).toEqual([0, 8, 16, 0, 16]);
  });

  it('groups pixels into cells', () => {
    expect([...bayerLevels(4, 2, 2)]).toEqual([0, 0, 8, 8, 0, 0, 8, 8]);
  });

  it('matches the golden mask at 25%', () => {
    const mask = bayerMask(bayerLevels(4, 4, 1), 0.25);
    expect([...mask]).toEqual([1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0]);
  });

  it('only ever adds cells as progress grows, and ends full', () => {
    const levels = bayerLevels(16, 16, 1);
    let previous = bayerMask(levels, 0);
    expect(previous.every((v) => v === 0)).toBe(true);
    for (let p = 0.05; p <= 1.0001; p += 0.05) {
      const next = bayerMask(levels, p);
      previous.forEach((v, i) => v && expect(next[i]).toBe(1));
      previous = next;
    }
    expect(previous.every((v) => v === 1)).toBe(true);
  });
});

describe('timeline', () => {
  const forward = buildTimeline(DEFAULT_OPTIONS.durations, 'forward');
  const reverse = buildTimeline(DEFAULT_OPTIONS.durations, 'reverse');

  it('lays the phases out in order', () => {
    expect(forward.phases.map((p) => p.name)).toEqual(['dither', 'out', 'in', 'undither']);
    expect(forward.total).toBe(1900);
    expect(forward.commitAt).toBe(450); // once the dither covers the screen
    expect(forward.gateAt).toBe(950); // the new page's content is needed from 'in'
    expect(reverse.phases.map((p) => p.name)).toEqual(['undither', 'in', 'out', 'dither']);
    expect(reverse.commitAt).toBe(450); // once the page being left has turned 1-bit
    expect(reverse.gateAt).toBe(950); // the new page's content is needed from 'out' (played backwards)
  });

  it('maps time to phase progress', () => {
    expect(frameAt(forward, 0)).toEqual({ name: 'dither', t: 0, index: 0 });
    expect(frameAt(forward, 225)).toEqual({ name: 'dither', t: 0.5, index: 0 });
    expect(frameAt(forward, 450)).toEqual({ name: 'out', t: 0, index: 1 });
    expect(frameAt(forward, 700)).toEqual({ name: 'out', t: 0.5, index: 1 });
    expect(frameAt(forward, 1900)).toEqual({ name: 'undither', t: 1, index: 3 });
    expect(frameAt(forward, 99999).name).toBe('undither');
    expect(frameAt(reverse, 0)).toEqual({ name: 'undither', t: 1, index: 0 });
    expect(frameAt(reverse, 225)).toEqual({ name: 'undither', t: 0.5, index: 0 });
    expect(frameAt(reverse, reverse.total)).toEqual({ name: 'dither', t: 0, index: 3 });
  });

  it('plays reverse as the mirror of forward', () => {
    for (const p of [0.03, 0.13, 0.3, 0.55, 0.62, 0.71, 0.9, 0.99]) {
      const a = frameAtProgress(forward, p);
      const b = frameAtProgress(reverse, 1 - p);
      expect(b.name).toBe(a.name);
      expect(b.t).toBeCloseTo(a.t, 6);
    }
  });

  it('gives both pages the same transform, mirrored', () => {
    const duration = (name) => forward.phases.find((p) => p.name === name).duration;
    expect(duration('undither')).toBe(duration('dither'));
    expect(duration('in')).toBe(duration('out'));
  });

  it('skips zero-length phases and builds the crossfade timeline', () => {
    expect(buildTimeline({ ...DEFAULT_OPTIONS.durations, out: 0 }, 'forward').phases.map((p) => p.name)).not.toContain('out');
    expect(buildTimeline({ ...DEFAULT_OPTIONS.durations, undither: 0 }, 'reverse').commitAt).toBe(0);
    expect(buildTimeline(DEFAULT_OPTIONS.durations, 'crossfade')).toMatchObject({ total: 150, phases: [{ name: 'fade' }] });
  });
});

describe('background fade', () => {
  it('goes from one background to the other in one smooth ease across out + in', () => {
    expect(backgroundMix('out', 0)).toBe(0);
    expect(backgroundMix('in', 1)).toBe(1);
    // continuous where out hands over to in
    expect(backgroundMix('out', 1)).toBeCloseTo(backgroundMix('in', 0), 9);
    let previous = 0;
    for (let k = 1; k <= 200; k += 1) {
      const u = k / 200;
      const mix = u <= 0.5 ? backgroundMix('out', u * 2) : backgroundMix('in', (u - 0.5) * 2);
      expect(mix).toBeGreaterThanOrEqual(previous); // never goes back: no blink
      expect(mix - previous).toBeLessThan(0.008); // no jumps
      previous = mix;
    }
  });

  it('follows the phase lengths', () => {
    // out is 300 of 1000 ms: the hand-over point sits at 30% of the fade
    expect(backgroundMix('out', 1, 0.3)).toBeCloseTo(backgroundMix('in', 0, 0.3), 9);
    expect(backgroundMix('out', 1, 0.3)).toBeCloseTo(0.3 * 0.3 * (3 - 0.6), 9);
  });
});

describe('dissolve', () => {
  it('generates stable thresholds for a seed', () => {
    const a = makeThresholds(64, 1984);
    expect(makeThresholds(64, 1984)).toEqual(a);
    expect(makeThresholds(64, 7)).not.toEqual(a);
    expect([...a].every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it('turns pixels off once progress passes their threshold', () => {
    const bits = new Uint8Array([1, 0]);
    const thresholds = new Float32Array([0.2, 0.8]);
    expect([...dissolve(bits, thresholds, 0, true)]).toEqual([WHITE, BLACK]); // inverted: ink is white
    expect([...dissolve(bits, thresholds, 0.5, true)]).toEqual([CLEAR, BLACK]);
    expect([...dissolve(bits, thresholds, 1, true)]).toEqual([CLEAR, CLEAR]);
    expect([...dissolve(null, thresholds, 0.5, false)]).toEqual([CLEAR, BLACK]); // plain mask
  });

  it('splits a page into background and content', () => {
    // light page: mostly white paper; the content is the black ink
    expect(contentOf(new Uint8Array([1, 0, 0, 0]))).toEqual({ content: new Uint8Array([1, 0, 0, 0]), background: 255, foreground: 0 });
    // dark page: mostly black; the content is the white text
    expect(contentOf(new Uint8Array([1, 1, 1, 0]))).toEqual({ content: new Uint8Array([0, 0, 0, 1]), background: 0, foreground: 255 });
    // a known dark background wins over the pixel count
    expect(contentOf(new Uint8Array([1, 0, 0, 0]), 0).content).toEqual(new Uint8Array([0, 1, 1, 1]));
  });

  it('removes the old content completely before any new content shows', () => {
    const thresholds = new Float32Array([0.2, 0.5, 0.8]);
    const light = contentOf(new Uint8Array([1, 0, 1]), 255); // black ink at 0 and 2
    const dark = contentOf(new Uint8Array([0, 1, 1]), 0); // white text at 0
    // leaving: ink disappears in threshold order
    expect([...paintSwitch(light, 255, thresholds, 0, false)]).toEqual([BLACK, WHITE, BLACK]);
    expect([...paintSwitch(light, 255, thresholds, 0.5, false)]).toEqual([WHITE, WHITE, BLACK]);
    // hand-over: only background, from both sides
    expect([...paintSwitch(light, 128, thresholds, 1, false)]).toEqual([gray(128), gray(128), gray(128)]);
    expect([...paintSwitch(dark, 128, thresholds, 0, true)]).toEqual([gray(128), gray(128), gray(128)]);
    // arriving: text appears in threshold order
    expect([...paintSwitch(dark, 0, thresholds, 0.5, true)]).toEqual([WHITE, BLACK, BLACK]);
  });

  it('lines up with the 1-bit images at both ends, so nothing jumps', () => {
    const thresholds = makeThresholds(64, 3);
    const lightBits = Uint8Array.from({ length: 64 }, (_, i) => (i % 7 === 0 ? 1 : 0));
    const darkBits = Uint8Array.from({ length: 64 }, (_, i) => (i % 5 === 0 ? 0 : 1));
    // start of 'out' = end of 'dither'
    expect(paintSwitch(contentOf(lightBits, 255), 255, thresholds, 0, false)).toEqual(paintBits(lightBits, false));
    // end of 'in' = start of 'undither'
    expect(paintSwitch(contentOf(darkBits, 0), 0, thresholds, 1, true)).toEqual(paintBits(darkBits, false));
  });

  it('paints positive, inverted and Bayer-masked images', () => {
    const bits = new Uint8Array([1, 0, 1, 0]);
    expect([...paintBits(bits, false)]).toEqual([BLACK, WHITE, BLACK, WHITE]);
    expect([...paintBits(bits, true)]).toEqual([WHITE, BLACK, WHITE, BLACK]);
    expect([...paintBayer(bits, bayerLevels(4, 1, 1), 0.25, false)]).toEqual([BLACK, CLEAR, BLACK, CLEAR]);
  });
});

describe('options', () => {
  it('merges durations and clamps numbers', () => {
    const o = resolveOptions({ durations: { undither: 100 }, pixelSize: 9, bayerCell: 0 });
    expect(o.durations).toMatchObject({ undither: 100, dither: 450 });
    expect(o.pixelSize).toBe(4);
    expect(o.bayerCell).toBe(1);
  });
});

describe('rasterize helpers', () => {
  it('splits on top-level commas', () => {
    expect(splitTopLevel('linear-gradient(90deg, rgb(1, 2, 3), red), url("a,b.png")')).toEqual(['linear-gradient(90deg, rgb(1, 2, 3), red)', 'url("a,b.png")']);
  });

  it('parses computed linear gradients', () => {
    const g = parseGradient('linear-gradient(90deg, rgb(255, 0, 0) 10%, rgb(0, 0, 255))', 100, 50);
    expect(g.type).toBe('linear');
    expect(g.angle).toBeCloseTo(Math.PI / 2);
    expect(g.stops).toEqual([
      { color: 'rgb(255, 0, 0)', at: 0.1 },
      { color: 'rgb(0, 0, 255)', at: null },
    ]);
    expect(parseGradient('linear-gradient(to right, red, blue)', 10, 10).angle).toBeCloseTo(Math.PI / 2);
    expect(parseGradient('url(x.png)', 1, 1)).toBeNull();
  });

  it('fits images like object-fit', () => {
    const box = { x: 0, y: 0, w: 100, h: 50 };
    expect(fitRect('contain', box, 200, 200)).toEqual({ x: 25, y: 0, w: 50, h: 50 });
    expect(fitRect('cover', box, 200, 200)).toEqual({ x: 0, y: -25, w: 100, h: 100 });
    expect(fitRect('fill', box, 1, 1)).toEqual(box);
  });
});

describe('pickTransition', () => {
  const plain = { id: 'a', label: 'A' };
  const oneBit = { id: 'b', label: 'B', transition: 'one-bit' };

  it('plays forward into, and reverse out of, a 1-bit page', () => {
    expect(pickTransition(plain, oneBit)).toBe('forward');
    expect(pickTransition(oneBit, plain)).toBe('reverse');
    expect(pickTransition(plain, plain)).toBe('none');
  });

  it('uses the configured mode between two 1-bit pages', () => {
    expect(pickTransition(oneBit, oneBit)).toBe('forward');
    expect(pickTransition(oneBit, oneBit, { oneBitToOneBit: 'none' })).toBe('none');
  });

  it('switches the transition on for chosen items only', () => {
    expect(withOneBit([plain, oneBit], ['a'])).toEqual([{ ...plain, transition: 'one-bit' }, { id: 'b', label: 'B', transition: 'default' }]);
  });
});
