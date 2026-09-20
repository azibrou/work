// The five MGH blobs, taken verbatim from src/images/mgh01..05.svg — same
// paths, same gradients, same opacities, so the card renders exactly like the
// exported artwork. Each file was cropped to its own bounding box, so every
// layer keeps its own viewBox and its gradient stays in that user space.
//
// `path` is the artwork outline at rest. The morph is generated per frame from
// it rather than tweened between fixed keyframes, so the motion never lands
// back on a start shape and never repeats a cycle.
export const BLOB_LAYERS = [
  {
    id: 'e',
    width: 745,
    height: 798,
    opacity: 0.1,
    duration: 15,
    gradient: { x1: 127.311, y1: 179.702, x2: 686.264, y2: 737.153 },
    stops: [
      { color: '#FFFF85', opacity: 1 },
      { color: '#3769FF', opacity: 1 },
    ],
    path:
      'M389.269 786.244C476.552 797.458 526.453 803.73 580.706 786.244C693.356 749.938 699.377 574.168 735.713 430.225C766.954 306.463 710.364 206.18 691.455 127.347C673.245 51.4303 515.098 -33.422 400.649 14.9785C286.201 63.3791 279.007 73.916 169.832 104.213C60.6569 134.509 27.8189 229.573 27.8189 324.543C27.8189 397.449 -54.2127 590.51 65.3437 648.43C117.673 673.78 202.315 686.571 254.518 708.988C321.583 737.786 327.453 778.302 389.269 786.244Z',
  },
  {
    id: 'd',
    width: 557,
    height: 531,
    opacity: 0.2,
    duration: 13,
    gradient: { x1: 57.3999, y1: 83.5623, x2: 444.517, y2: 532.266 },
    stops: [
      { color: '#FFD47E', opacity: 1 },
      { color: '#39C4FF', opacity: 1 },
    ],
    path:
      'M197.203 497.779C271.439 522.632 416.158 570.101 494.378 468.783C523.339 431.27 523.886 390.289 544.308 330.399C583.59 215.198 517.054 174.757 494.378 128.115C471.137 80.311 454.054 32.8674 413.796 13.6646C367.661 -8.34085 297.775 1.86232 244.599 13.6646C199.819 23.6031 151.702 52.7882 120.594 60.1604C31.7766 81.2094 59.2215 157.529 6.04832 265.296C-15.1565 308.271 28.3257 350.452 34.6424 414.934C39.4128 463.631 122.968 472.925 197.203 497.779Z',
  },
  {
    id: 'c',
    width: 363,
    height: 414,
    opacity: 0.3,
    duration: 11,
    gradient: { x1: 34.2645, y1: 67.475, x2: 363.935, y2: 298.951 },
    stops: [
      { color: '#FFBB6C', opacity: 1 },
      { color: '#53E5FF', opacity: 1 },
    ],
    path:
      'M238.659 413.352C298.361 413.352 377.799 323.959 359.68 261.255C347.744 219.946 363.33 159.936 319.973 128.019C227.261 59.7714 278.298 -27.1412 168.74 8.39483C123.227 23.1574 91.6763 43.4047 62.6944 54.4796C-3.9924 79.9626 21.5065 145.752 4.88055 221.606C-1.64716 251.388 -2.44491 282.807 20.4568 298.877C52.8507 321.607 117.437 324.979 148.543 347.806C183.761 373.65 201.532 413.352 238.659 413.352Z',
  },
  {
    id: 'b',
    width: 263,
    height: 286,
    opacity: 0.5,
    duration: 12,
    gradient: { x1: 24.896, y1: 41.7885, x2: 245.729, y2: 244.821 },
    stops: [
      { color: '#F97D3B', opacity: 1 },
      { color: '#84FFDF', opacity: 1 },
    ],
    path:
      'M92.0155 266.627C141.467 264.556 208.282 299.169 219.089 279.228C239.566 241.442 269.444 241.442 261.672 213.805C253.9 186.169 223.109 182.288 204.689 115.3C186.268 48.3118 162.849 -4.96616 114.471 1.46896C84.4975 5.45597 34.6202 17.6335 15.6202 44.6186C-6.54539 76.0995 20.0906 128.232 6.02272 155.758C-15.9416 198.733 32.837 216.579 48.7397 230.318C65.0975 244.45 56.6908 268.106 92.0155 266.627Z',
  },
  {
    id: 'a',
    width: 176,
    height: 212,
    opacity: 0.9,
    duration: 9,
    gradient: { x1: 10.7578, y1: 19.4067, x2: 208.332, y2: 213.867 },
    stops: [
      { color: '#FF633F', opacity: 1 },
      { color: '#FDF5B7', opacity: 0.9 },
    ],
    path:
      'M86.127 206.144C93.736 208.754 111.659 202.687 126.503 204.669C141.162 206.626 157.763 214.405 168.308 210.382C173.118 208.547 178.862 193.061 172.658 190.019C166.454 186.976 160.847 176.708 157.763 172.727C148.608 160.906 126.32 157.266 119.543 149.615C106.099 134.439 100.821 113.369 105.075 86.5108C107.368 72.0309 113.1 35.8457 97.6628 33.4007C81.4477 30.8325 75.7186 4.38804 52.0461 0.638675C19.0081 -4.59402 7.97749 26.8031 4.76929 50.6855C-0.122417 87.1004 -4.99538 113.087 11.5456 132.51C41.0055 167.104 46.7058 192.62 86.127 206.144Z',
  },
];

// Each outline is `M x y` followed by cubic `C` segments and a closing `Z`, so
// the geometry splits cleanly into anchors (where the curve passes through) and
// the two control points that shape the curve between each pair of anchors.
// The morph needs them apart: moving an anchor slides a bend, while stretching
// its handles changes how sharply that bend turns.
export function parseBlobPath(d) {
  const nums = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi).map(Number);
  const anchors = [[nums[0], nums[1]]];
  const segments = [];

  for (let i = 2; i + 5 < nums.length; i += 6) {
    segments.push([
      [nums[i], nums[i + 1]],
      [nums[i + 2], nums[i + 3]],
    ]);
    anchors.push([nums[i + 4], nums[i + 5]]);
  }
  // The closing curve lands back on the opening anchor; keep a single copy.
  anchors.pop();

  let sx = 0;
  let sy = 0;
  for (const [x, y] of anchors) {
    sx += x;
    sy += y;
  }
  const cx = sx / anchors.length;
  const cy = sy / anchors.length;

  let total = 0;
  for (const [x, y] of anchors) total += Math.hypot(x - cx, y - cy);

  return { anchors, segments, cx, cy, radius: total / anchors.length };
}

// Each layer is deformed by its own reading of the field: `seed` rotates where
// that layer's lobes sit and offsets when they pulse, so every blob floats on
// its own schedule rather than echoing its neighbours. Nothing keeps the
// contours from meeting except headroom, so the amplitude is capped at a value
// measured against the rendered card — see MORPH_AMOUNT in MghCard.
//
// The waves stand rather than travel: each term is sin(lobes * angle) times
// sin(time), so a lobe is pinned to fixed angles and only its depth pulses.
// Writing it as sin(lobes * angle + speed * time) instead would send the lobes
// marching around the outline, which reads as the shape rotating and sloshing
// rather than changing form.

// Radial terms: these push the outline out and pull it in, which is what makes
// bulges and hollows appear.
const SWELL = [
  { lobes: 1, pace: 0.27, weight: 1, atAngle: 0, atTime: 0 },
  { lobes: 2, pace: 0.22 * Math.SQRT2, weight: 0.8, atAngle: 1.1, atTime: 2.2 },
  { lobes: 3, pace: 0.085 * Math.PI, weight: 0.55, atAngle: 2.7, atTime: 0.9 },
  { lobes: 5, pace: 0.14 * Math.SQRT2, weight: 0.3, atAngle: 0.4, atTime: 3.6 },
];

// Tangential terms: these slide bends around the outline, so a hollow does not
// merely deepen in place but drifts along the contour.
const SLIDE = [
  { lobes: 2, pace: 0.195, weight: 1, atAngle: 0.8, atTime: 1.4 },
  { lobes: 3, pace: 0.155 * Math.SQRT2, weight: 0.6, atAngle: 2.1, atTime: 0.3 },
];

// How the morph budget is split. Radial swelling closes the gap to the next
// contour; sliding and rebending do not, so they carry most of the movement.
const RADIAL_SHARE = 0.4;
const TANGENT_SHARE = 1.2;
const REBEND_SHARE = 4;

function fieldAt(bands, angle, t, seed) {
  let sum = 0;
  let norm = 0;
  for (const band of bands) {
    sum +=
      band.weight *
      Math.sin(band.lobes * angle + band.atAngle + seed * 1.7) *
      Math.sin(t * band.pace + band.atTime + seed * 2.3);
    norm += band.weight;
  }
  return sum / norm;
}

// How far a segment's handles reach, as a multiple of their resting length.
// Shortening them pulls the curve towards a straight run between its anchors;
// lengthening them bows it out. This is what bends the curve itself, as opposed
// to relocating it, and it carries the same per-layer seed as the rest.
function handleScaleAt(angle, t, seed, amount) {
  return 1 + amount * Math.sin(2 * angle + 0.6 + seed * 1.7) * Math.sin(t * 0.22 + 1.2 + seed * 2.3);
}

// Rebuilds `d` for one frame. Each control travels rigidly with the anchor it
// belongs to, and is only ever stretched or shortened along the line it already
// points down. Both handles meeting at an anchor therefore keep the directions
// they started with, so a join that was smooth in the artwork stays smooth —
// blending a control between two anchors instead tilts the two handles apart
// and pinches the outline into a corner.
export function blobPathAt({ anchors, segments, cx, cy, radius }, t, seed, amplitude) {
  const scale = radius * amplitude;
  const count = anchors.length;
  const fmt = (value) => value.toFixed(2);

  const angles = anchors.map(([x, y]) => Math.atan2(y - cy, x - cx));

  const shifts = anchors.map(([x, y], i) => {
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.hypot(dx, dy) || 1;
    // Radial motion is the only part that eats into the gap to the neighbouring
    // contour, so it is kept on a short leash. Sliding bends along the outline
    // and rebending the curves reshapes the blob just as visibly without
    // pushing its envelope outwards, which is what buys each layer the freedom
    // to drift on its own.
    const out = fieldAt(SWELL, angles[i], t, seed) * scale * RADIAL_SHARE;
    const along = fieldAt(SLIDE, angles[i], t, seed) * scale * TANGENT_SHARE;
    return [(dx / r) * out - (dy / r) * along, (dy / r) * out + (dx / r) * along];
  });
  const moved = anchors.map(([x, y], i) => [x + shifts[i][0], y + shifts[i][1]]);

  let d = `M${fmt(moved[0][0])} ${fmt(moved[0][1])}`;

  for (let i = 0; i < segments.length; i += 1) {
    const next = (i + 1) % count;
    const from = moved[i];
    const to = moved[next];
    const [c1, c2] = segments[i];
    const reach = handleScaleAt(angles[i], t, seed, amplitude * REBEND_SHARE);

    // Move the handle with its own anchor, then scale it about that anchor —
    // length changes, direction does not.
    const carry = (point, shift, about) => [
      about[0] + (point[0] + shift[0] - about[0]) * reach,
      about[1] + (point[1] + shift[1] - about[1]) * reach,
    ];

    const h1 = carry(c1, shifts[i], from);
    const h2 = carry(c2, shifts[next], to);

    d += `C${fmt(h1[0])} ${fmt(h1[1])} ${fmt(h2[0])} ${fmt(h2[1])} ${fmt(to[0])} ${fmt(to[1])}`;
  }

  return `${d}Z`;
}
