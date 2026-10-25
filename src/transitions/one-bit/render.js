// Draws one frame of the transition onto the overlay canvas. Deterministic:
// the same assets and frame always give the same pixels, which is what lets the
// Storybook scrubber show any moment of the timeline.

import { bayerStep, BAYER_LEVELS } from './bayer.js';
import { backgroundMix, contentOf, gray, paintBayer, paintBits, paintSwitch } from './dissolve.js';

/**
 * @param {HTMLCanvasElement} canvas the overlay, sized to the viewport in device px
 * @param {object} assets built once per run (see buildAssets in oneBitTransition.js)
 *   viewport   { width, height, dpr }
 *   grid       { width, height } of the 1-bit buffers
 *   first      Uint8Array | null  1-bit image of the page being left (forward terms)
 *   second     Uint8Array | null  1-bit image of the page arrived at (forward terms)
 *   tones      { first, second }  each page's background, 0 (dark) or 255 (light), or null if not known yet
 *   levels     Uint8Array         Bayer rank per 1-bit pixel
 *   thresholds Float32Array       pixel order for the content switch
 *   outShare   number             'out' share of out + in, for the background fade
 *   pixelSize, mode
 *   underlays  { fade? }          capture faded out by the reduced-motion crossfade
 *   live       { [phase]: capture } stands in for the live page (scrubber only)
 * Images and tones can arrive later (setImage / setTone), before the frames that need them.
 */
export function createRenderer(canvas, assets) {
  const { viewport, grid, levels, thresholds, pixelSize, outShare = 0.5, underlays = {}, live = {} } = assets;
  const { dpr } = viewport;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const gridW = grid.width * pixelSize * dpr;
  const gridH = grid.height * pixelSize * dpr;

  // One small canvas + one ImageData, reused every frame.
  const work = document.createElement('canvas');
  work.width = grid.width;
  work.height = grid.height;
  const workCtx = work.getContext('2d');
  const image = workCtx.createImageData(grid.width, grid.height);
  const pixels = new Uint32Array(image.data.buffer);

  const images = { first: null, second: null };
  const tones = { first: null, second: null, ...assets.tones };
  const pages = { first: null, second: null };
  let positiveFirst = null;
  let positiveSecond = null;

  const bitsCanvas = (bits) => {
    const c = document.createElement('canvas');
    c.width = grid.width;
    c.height = grid.height;
    const cctx = c.getContext('2d');
    const img = cctx.createImageData(grid.width, grid.height);
    paintBits(bits, false, new Uint32Array(img.data.buffer));
    cctx.putImageData(img, 0, 0);
    return c;
  };
  const refresh = (slot) => {
    const bits = images[slot];
    pages[slot] = bits ? contentOf(bits, tones[slot] ?? undefined) : null;
    if (slot === 'first') positiveFirst = bits ? bitsCanvas(bits) : null;
    else positiveSecond = bits ? bitsCanvas(bits) : null;
  };
  function setImage(slot, bits) {
    images[slot] = bits;
    refresh(slot);
  }
  function setTone(slot, tone) {
    tones[slot] = tone;
    if (images[slot]) refresh(slot);
  }
  setImage('first', assets.first ?? null);
  setImage('second', assets.second ?? null);

  const blit = (source) => {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0, gridW, gridH);
  };
  const blitPixels = () => {
    workCtx.putImageData(image, 0, 0);
    blit(work);
  };
  const drawCapture = (capture, alpha = 1, op = 'source-over') => {
    if (!capture || alpha <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = op;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(capture.canvas, 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };
  // A 1-bit image in Bayer cells, see-through elsewhere (the live page shows there).
  const bayer = (bits, positive, progress) => {
    const step = bayerStep(progress);
    if (!bits || step === 0) return;
    if (step === BAYER_LEVELS) {
      blit(positive);
      return;
    }
    paintBayer(bits, levels, progress, false, pixels);
    blitPixels();
  };
  // The background between the two pages' tones; one smooth fade over out + in.
  const backgroundAt = (phase, t) => {
    const from = tones.first ?? pages.first?.background ?? 255;
    const to = tones.second ?? pages.second?.background ?? from;
    return from + (to - from) * backgroundMix(phase, t, outShare);
  };
  const switchFrame = (page, phase, t, arriving) => {
    const background = backgroundAt(phase, t);
    if (page) paintSwitch(page, background, thresholds, t, arriving, pixels);
    else pixels.fill(gray(background));
    blitPixels();
  };

  /** @param {{ name: string, t: number }} frame */
  function draw(frame) {
    const { name, t } = frame;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);

    switch (name) {
      case 'dither':
        // The page being left flips to 1-bit cell by cell.
        bayer(images.first, positiveFirst, t);
        break;
      case 'out':
        // Its content disappears pixel by pixel; nothing new shows yet.
        switchFrame(pages.first, 'out', t, false);
        break;
      case 'in':
        // Only then does the new content appear, pixel by pixel.
        switchFrame(pages.second, 'in', t, true);
        break;
      case 'undither':
        // The new page flips from 1-bit to live, the same way the old one left.
        bayer(images.second, positiveSecond, 1 - t);
        break;
      case 'fade':
        drawCapture(underlays.fade, 1 - t);
        break;
      default:
        break;
    }

    // Scrubber only: paint the captured page wherever the overlay is see-through.
    drawCapture(live[name], 1, 'destination-over');
  }

  return { draw, setImage, setTone };
}
