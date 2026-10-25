// Ordered 4×4 Bayer mask: the page flips to 1-bit cell by cell in a fixed,
// structured order instead of crossfading.

export const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const BAYER_LEVELS = 16;

/** Bayer rank (0–15) of the cell at column cx, row cy. */
export function bayerLevel(cx, cy) {
  return BAYER_4[(cy & 3) * 4 + (cx & 3)];
}

/** How many of the 16 ranks are switched on at this progress (0 → none, 1 → all). */
export function bayerStep(progress) {
  return Math.round(Math.min(1, Math.max(0, progress)) * BAYER_LEVELS);
}

/**
 * Rank for every pixel of a grid, with cells of cellSize grid pixels.
 * Computed once per run; each frame only compares against it.
 * @returns {Uint8Array}
 */
export function bayerLevels(width, height, cellSize) {
  const cell = Math.max(1, Math.round(cellSize));
  const levels = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const cy = Math.floor(y / cell);
    for (let x = 0; x < width; x += 1) levels[y * width + x] = bayerLevel(Math.floor(x / cell), cy);
  }
  return levels;
}

/**
 * On/off mask at a progress value: 1 where the 1-bit image shows.
 * @param {Uint8Array} levels from bayerLevels
 * @param {number} progress 0–1
 * @param {Uint8Array} [out] reused buffer
 */
export function bayerMask(levels, progress, out = new Uint8Array(levels.length)) {
  const step = bayerStep(progress);
  for (let i = 0; i < levels.length; i += 1) out[i] = levels[i] < step ? 1 : 0;
  return out;
}
