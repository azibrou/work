// Atkinson error diffusion, as on the original Macintosh. Pure: works on any
// ImageData-like object ({ data, width, height }), so it runs in tests and workers.

export const LUMA = [0.3, 0.59, 0.11];
export const THRESHOLD = 128;

// Neighbours that each get 1/8 of the error. Six of eight eighths are passed on;
// the other 2/8 are dropped, which is what gives Atkinson its crisp highlights.
const SPREAD = [
  [1, 0],
  [2, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
  [0, 2],
];

/**
 * Grayscale, averaged over pixelSize × pixelSize blocks. Transparent pixels count as white.
 * @param {{ data: ArrayLike<number>, width: number, height: number }} imageData
 * @param {number} [pixelSize=1] source pixels per output pixel
 * @returns {{ gray: Float32Array, width: number, height: number }}
 */
export function toGray({ data, width, height }, pixelSize = 1) {
  const size = Math.max(1, Math.floor(pixelSize));
  const outW = Math.ceil(width / size);
  const outH = Math.ceil(height / size);
  const gray = new Float32Array(outW * outH);
  const counts = size === 1 ? null : new Uint16Array(outW * outH);
  const [wr, wg, wb] = LUMA;

  for (let y = 0; y < height; y += 1) {
    const row = Math.floor(y / size) * outW;
    for (let x = 0; x < width; x += 1) {
      const p = (y * width + x) * 4;
      const alpha = data[p + 3] / 255;
      const luma = (wr * data[p] + wg * data[p + 1] + wb * data[p + 2]) * alpha + 255 * (1 - alpha);
      const o = row + Math.floor(x / size);
      gray[o] += luma;
      if (counts) counts[o] += 1;
    }
  }
  if (counts) for (let i = 0; i < gray.length; i += 1) gray[i] /= counts[i];
  return { gray, width: outW, height: outH };
}

/**
 * 1-bit dither. bits[i] is 1 for ink (black) and 0 for paper (white).
 * @param {{ data: ArrayLike<number>, width: number, height: number }} imageData
 * @param {number} [pixelSize=1] source pixels per output pixel (the core downsamples on the GPU first and passes 1)
 * @returns {{ bits: Uint8Array, width: number, height: number }}
 */
export function atkinson(imageData, pixelSize = 1) {
  const { gray, width, height } = toGray(imageData, pixelSize);
  const bits = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const value = gray[i];
      const ink = value < THRESHOLD;
      bits[i] = ink ? 1 : 0;
      const share = (value - (ink ? 0 : 255)) / 8;
      if (share === 0) continue;
      for (const [dx, dy] of SPREAD) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny < height) gray[ny * width + nx] += share;
      }
    }
  }
  return { bits, width, height };
}
