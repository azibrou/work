// Custom DOM → canvas rasterizer for the visible viewport.
//
// The portfolio pages are built from a small known set of primitives: text,
// <img>, inline <svg>, solid/gradient/url backgrounds, rounded clipped boxes and
// CSS transforms. Drawing those directly is faster than a generic DOM-to-canvas
// library and gets text right, because every word is placed at the rect the
// browser laid it out at and drawn with the same computed font.
//
// Two passes: collect() reads every rect and computed style up front (no layout
// work happens later), then paint() draws the display list after the async
// resources (inline SVGs turned into images, background images) are ready.

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT', 'HEAD', 'TITLE']);
const SVG_PROPS = [
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stop-color',
  'stop-opacity',
  'font-family',
  'font-size',
  'font-weight',
  'visibility',
];

const px = (value) => parseFloat(value) || 0;

function length(value, reference) {
  if (!value) return 0;
  return value.endsWith('%') ? (parseFloat(value) / 100) * reference : parseFloat(value) || 0;
}

function intersects(r, vp) {
  return r.right > 0 && r.bottom > 0 && r.left < vp.width && r.top < vp.height && r.width > 0 && r.height > 0;
}

function transparent(color) {
  return !color || color === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(color) || /\/\s*0\)$/.test(color);
}

function radii(cs, w, h) {
  const corner = (v) => length(v.split(' ')[0], w);
  const r = [corner(cs.borderTopLeftRadius), corner(cs.borderTopRightRadius), corner(cs.borderBottomRightRadius), corner(cs.borderBottomLeftRadius)];
  if (!r.some(Boolean)) return null;
  // CSS shrinks all corners together when they don't fit.
  const f = Math.min(1, w / (r[0] + r[1] || 1), w / (r[3] + r[2] || 1), h / (r[0] + r[3] || 1), h / (r[1] + r[2] || 1));
  return r.map((v) => v * f);
}

function boxPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (r) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

// Splits on commas that are not inside parentheses.
export function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (ch === ',' && depth === 0) {
      parts.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts.filter(Boolean);
}

function angleToRad(value) {
  const m = /^(-?[\d.]+)(deg|rad|turn|grad)$/.exec(value.trim());
  if (!m) return null;
  const n = parseFloat(m[1]);
  return { deg: (n * Math.PI) / 180, rad: n, turn: n * 2 * Math.PI, grad: (n * Math.PI) / 200 }[m[2]];
}

const SIDE_ANGLES = { top: 0, right: 90, bottom: 180, left: 270 };

/** Parses a computed linear/radial-gradient() into { type, angle, stops: [{ color, at }] } (at in 0–1 or px). */
export function parseGradient(layer, w, h) {
  const m = /^(repeating-)?(linear|radial)-gradient\((.*)\)$/s.exec(layer);
  if (!m) return null;
  const args = splitTopLevel(m[3]);
  let angle = Math.PI; // to bottom
  const first = args[0];
  if (m[2] === 'linear') {
    const rad = angleToRad(first);
    if (rad !== null) {
      angle = rad;
      args.shift();
    } else if (first.startsWith('to ')) {
      const sides = first.slice(3).split(/\s+/);
      if (sides.length === 1) angle = (SIDE_ANGLES[sides[0]] * Math.PI) / 180;
      else {
        const dx = sides.includes('right') ? 1 : -1;
        const dy = sides.includes('top') ? -1 : 1;
        // Magic corners: perpendicular to the diagonal between the other two corners.
        angle = Math.atan2(dx * h, -dy * w);
      }
      args.shift();
    }
  } else if (!/^(rgb|hsl|#|color|[a-z]+$)/.test(first) || /circle|ellipse|at /.test(first)) {
    args.shift(); // radial shape/position: approximated as a centred farthest-corner circle
  }
  const stops = args.map((arg) => {
    const s = /^(.*?)\s+(-?[\d.]+)(%|px)(?:\s+-?[\d.]+(?:%|px))?$/.exec(arg);
    if (!s) return { color: arg, at: null };
    return { color: s[1], at: s[3] === '%' ? parseFloat(s[2]) / 100 : { px: parseFloat(s[2]) } };
  });
  return { type: m[2], angle, stops };
}

function fillStops(gradient, stops, lineLength) {
  const at = stops.map((s) => (s.at === null ? null : typeof s.at === 'number' ? s.at : s.at.px / lineLength));
  if (at[0] === null) at[0] = 0;
  if (at[at.length - 1] === null) at[at.length - 1] = 1;
  for (let i = 1; i < at.length; i += 1) {
    if (at[i] !== null) continue;
    let j = i;
    while (at[j] === null) j += 1;
    for (let k = i; k < j; k += 1) at[k] = at[i - 1] + ((at[j] - at[i - 1]) * (k - i + 1)) / (j - i + 1);
  }
  let last = 0;
  stops.forEach((s, i) => {
    last = Math.max(last, Math.min(1, Math.max(0, at[i])));
    try {
      gradient.addColorStop(last, s.color);
    } catch {
      /* unparseable colour: skip the stop */
    }
  });
}

function canvasGradient(ctx, g, x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (g.type === 'radial') {
    const r = Math.hypot(w / 2, h / 2);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    fillStops(gradient, g.stops, r);
    return gradient;
  }
  const dx = Math.sin(g.angle);
  const dy = -Math.cos(g.angle);
  const len = Math.abs(w * dx) + Math.abs(h * dy);
  const gradient = ctx.createLinearGradient(cx - (dx * len) / 2, cy - (dy * len) / 2, cx + (dx * len) / 2, cy + (dy * len) / 2);
  fillStops(gradient, g.stops, len);
  return gradient;
}

// The element's own CSS transform (transform + translate/rotate/scale, about its origin).
function ownTransform(cs, w, h) {
  const has = (v) => v && v !== 'none';
  if (!has(cs.transform) && !has(cs.rotate) && !has(cs.scale) && !has(cs.translate)) return null;
  const [ox, oy] = cs.transformOrigin.split(' ').map(px);
  const m = new DOMMatrix().translateSelf(ox, oy);
  if (has(cs.translate)) {
    const [tx, ty = '0px'] = cs.translate.split(' ');
    m.translateSelf(length(tx, w), length(ty, h));
  }
  if (has(cs.rotate)) {
    const parts = cs.rotate.split(' ');
    const rad = angleToRad(parts[parts.length - 1]);
    const zAxis = parts.length === 1 || parts[0] === 'z' || (parts.length === 4 && px(parts[0]) === 0 && px(parts[1]) === 0);
    if (rad !== null && zAxis) m.rotateSelf((rad * 180) / Math.PI);
  }
  if (has(cs.scale)) {
    const [sx, sy = sx] = cs.scale.split(' ').map(Number);
    m.scaleSelf(sx, sy);
  }
  if (has(cs.transform)) {
    try {
      m.multiplySelf(new DOMMatrix(cs.transform));
    } catch {
      /* 3D or unsupported: ignore */
    }
  }
  return m.translateSelf(-ox, -oy);
}

// Matrix that maps the element's untransformed local box onto the viewport.
// The rect we get from the browser is the bounding box of the transformed
// element, so its top-left tells us where the untransformed box sits.
function placement(el, cs, rect) {
  const svg = el instanceof SVGElement;
  const w = svg ? px(cs.width) || rect.width : el.offsetWidth || rect.width;
  const h = svg ? px(cs.height) || rect.height : el.offsetHeight || rect.height;
  const own = ownTransform(cs, w, h);
  if (!own) return { w, h, matrix: new DOMMatrix().translateSelf(rect.left, rect.top) };
  const corners = [
    [0, 0],
    [w, 0],
    [0, h],
    [w, h],
  ].map(([x, y]) => own.transformPoint({ x, y }));
  const minX = Math.min(...corners.map((p) => p.x));
  const minY = Math.min(...corners.map((p) => p.y));
  return { w, h, matrix: new DOMMatrix().translateSelf(rect.left - minX, rect.top - minY).multiplySelf(own) };
}

function contentBox(cs, w, h) {
  const left = px(cs.paddingLeft) + px(cs.borderLeftWidth);
  const top = px(cs.paddingTop) + px(cs.borderTopWidth);
  const right = px(cs.paddingRight) + px(cs.borderRightWidth);
  const bottom = px(cs.paddingBottom) + px(cs.borderBottomWidth);
  return { x: left, y: top, w: Math.max(0, w - left - right), h: Math.max(0, h - top - bottom) };
}

function positionOffset(token, free) {
  if (!token) return free / 2;
  if (token.endsWith('%')) return (parseFloat(token) / 100) * free;
  return { left: 0, top: 0, center: free / 2, right: free, bottom: free }[token] ?? px(token);
}

/** Destination rect of an object-fit image inside its content box. */
export function fitRect(fit, box, naturalW, naturalH, position = '50% 50%') {
  if (!naturalW || !naturalH || fit === 'fill') return { ...box };
  const contain = Math.min(box.w / naturalW, box.h / naturalH);
  const scale = { contain, cover: Math.max(box.w / naturalW, box.h / naturalH), none: 1, 'scale-down': Math.min(1, contain) }[fit] ?? contain;
  const w = naturalW * scale;
  const h = naturalH * scale;
  const [px0, py0] = position.split(' ');
  return { x: box.x + positionOffset(px0, box.w - w), y: box.y + positionOffset(py0, box.h - h), w, h };
}

function textTransform(word, mode) {
  if (mode === 'uppercase') return word.toUpperCase();
  if (mode === 'lowercase') return word.toLowerCase();
  if (mode === 'capitalize') return word.charAt(0).toUpperCase() + word.slice(1);
  return word;
}

function fontOf(cs) {
  return `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
}

function textStyle(cs) {
  return {
    font: fontOf(cs),
    color: cs.color,
    letterSpacing: cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing,
    underline: cs.textDecorationLine?.includes('underline') ? cs.textDecorationColor || cs.color : null,
    fontSize: px(cs.fontSize),
    transform: cs.textTransform,
  };
}

function collectText(node, cs, vp, range, ops) {
  if (!node.data.trim() || cs.visibility !== 'visible' || transparent(cs.color)) return;
  range.selectNodeContents(node);
  if (!intersects(range.getBoundingClientRect(), vp)) return;
  const style = textStyle(cs);
  for (const match of node.data.matchAll(/\S+/g)) {
    range.setStart(node, match.index);
    range.setEnd(node, match.index + match[0].length);
    const rects = range.getClientRects();
    if (rects.length === 1) {
      const r = rects[0];
      if (intersects(r, vp)) ops.push({ op: 'text', text: textTransform(match[0], style.transform), x: r.left, y: r.top, h: r.height, style });
      continue;
    }
    // A word broken across lines: place each character on its own.
    for (let i = 0; i < match[0].length; i += 1) {
      range.setStart(node, match.index + i);
      range.setEnd(node, match.index + i + 1);
      const r = range.getBoundingClientRect();
      if (intersects(r, vp)) ops.push({ op: 'text', text: textTransform(match[0][i], style.transform), x: r.left, y: r.top, h: r.height, style });
    }
  }
}

// Paint order within a parent: negative z-index, in-flow content, positioned, positive z-index.
function stackKey(cs) {
  const positioned = cs.position !== 'static';
  const z = cs.zIndex === 'auto' ? null : parseInt(cs.zIndex, 10);
  if (z !== null && (positioned || cs.display.includes('flex') || cs.display.includes('grid'))) return z < 0 ? z : z === 0 ? 0.5 : z;
  return positioned ? 0.5 : 0;
}

function svgAsset(el, cs, w, h) {
  const clone = el.cloneNode(true);
  const source = [el, ...el.querySelectorAll('*')];
  const target = [clone, ...clone.querySelectorAll('*')];
  source.forEach((node, i) => {
    const style = getComputedStyle(node);
    const out = target[i];
    if (i === 0) out.removeAttribute('style');
    for (const prop of SVG_PROPS) out.style.setProperty(prop, style.getPropertyValue(prop));
    if (i > 0) out.style.setProperty('opacity', style.opacity);
    if (style.display === 'none') out.style.setProperty('display', 'none');
  });
  // An <svg> drawn as an image is clipped to its viewport, so when it is
  // overflow: visible we widen the viewBox by half on each side and draw the
  // image larger to keep shapes that spill past the edge.
  const vb = el.viewBox?.baseVal;
  let margin = { x: 0, y: 0 };
  if (cs.overflow === 'visible' && vb && vb.width && vb.height) {
    const mx = vb.width / 2;
    const my = vb.height / 2;
    clone.setAttribute('viewBox', `${vb.x - mx} ${vb.y - my} ${vb.width + 2 * mx} ${vb.height + 2 * my}`);
    margin = { x: (mx * w) / vb.width, y: (my * h) / vb.height };
  }
  clone.setAttribute('width', String(w + 2 * margin.x));
  clone.setAttribute('height', String(h + 2 * margin.y));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const img = new Image();
  const markup = new XMLSerializer().serializeToString(clone);
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  return {
    image: img,
    margin,
    ready: img.decode().then(
      () => true,
      () => false,
    ),
  };
}

function urlAsset(url) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  return {
    image: img,
    ready: img.decode().then(
      () => true,
      () => false,
    ),
  };
}

/**
 * Reads the visible viewport into a display list. Synchronous: every rect and
 * style is read here, never during animation.
 */
export function collect(root, vp, { ignoreSelector = '[data-onebit-ignore]' } = {}) {
  const ops = [];
  const assets = [];
  const range = document.createRange();

  const pushImage = (el, cs, rect, source) => {
    const { w, h, matrix } = placement(el, cs, rect);
    const box = contentBox(cs, w, h);
    ops.push({ op: 'image', source, matrix, w, h, box, fit: cs.objectFit, position: cs.objectPosition, radii: radii(cs, w, h) });
  };

  const walk = (el) => {
    if (SKIP_TAGS.has(el.tagName) || (ignoreSelector && el.matches(ignoreSelector))) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    const opacity = px(cs.opacity);
    if (cs.opacity !== '' && opacity === 0) return;
    const rect = el.getBoundingClientRect();
    const visible = cs.visibility === 'visible';
    const onScreen = intersects(rect, vp);
    const clips = cs.overflowX !== 'visible' || cs.overflowY !== 'visible';
    if (!onScreen && clips) return;

    const filter = cs.filter && cs.filter !== 'none' ? cs.filter : null;
    const blend = cs.mixBlendMode && cs.mixBlendMode !== 'normal' ? cs.mixBlendMode : null;
    ops.push({ op: 'save', alpha: cs.opacity === '' ? 1 : opacity, filter, blend });

    const tag = el.tagName;
    const r = radii(cs, rect.width, rect.height);
    if (visible && onScreen && cs.display !== 'contents') {
      const bg = transparent(cs.backgroundColor) ? null : cs.backgroundColor;
      const layers = cs.backgroundImage && cs.backgroundImage !== 'none' ? splitTopLevel(cs.backgroundImage) : [];
      const borderW = px(cs.borderTopWidth);
      const border = borderW > 0 && cs.borderTopStyle !== 'none' && !transparent(cs.borderTopColor) ? { width: borderW, color: cs.borderTopColor } : null;
      if (bg || layers.length || border) {
        const images = layers.map((layer) => {
          const url = /^url\(["']?(.*?)["']?\)$/.exec(layer);
          if (!url) return { gradient: layer };
          const asset = urlAsset(url[1]);
          assets.push(asset);
          return { asset };
        });
        ops.push({
          op: 'box',
          x: rect.left,
          y: rect.top,
          w: rect.width,
          h: rect.height,
          radii: r,
          bg,
          images: images.reverse(), // CSS lists the top layer first
          size: cs.backgroundSize,
          position: cs.backgroundPosition,
          repeat: cs.backgroundRepeat,
          border,
        });
      }
    }

    const replaced = tag === 'IMG' || tag === 'CANVAS' || tag === 'VIDEO' || tag === 'svg' || tag === 'IFRAME' || tag === 'OBJECT' || tag === 'EMBED';
    if (replaced) {
      if (visible && onScreen) {
        if (tag === 'svg') {
          const { w, h } = placement(el, cs, rect);
          const asset = svgAsset(el, cs, w, h);
          assets.push(asset);
          pushImage(el, cs, rect, { svg: asset });
        } else if (tag === 'IMG' || tag === 'CANVAS' || tag === 'VIDEO') {
          pushImage(el, cs, rect, { element: el });
        } else {
          pushImage(el, cs, rect, { placeholder: true });
        }
      }
      ops.push({ op: 'restore' });
      return;
    }

    if ((tag === 'INPUT' || tag === 'TEXTAREA') && visible && onScreen && el.type !== 'hidden' && el.value) {
      const box = contentBox(cs, rect.width, rect.height);
      ops.push({ op: 'text', text: el.type === 'password' ? '•'.repeat(el.value.length) : el.value.split('\n')[0], x: rect.left + box.x, y: rect.top + box.y, h: box.h, style: textStyle(cs) });
    }

    if (clips) ops.push({ op: 'save', alpha: 1, clip: { x: rect.left, y: rect.top, w: rect.width, h: rect.height, radii: r } });

    const children = [];
    let order = 0;
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) children.push({ key: 0, order: (order += 1), text: child });
      else if (child.nodeType === Node.ELEMENT_NODE) {
        const ccs = getComputedStyle(child);
        children.push({ key: stackKey(ccs), order: (order += 1), el: child });
      }
    }
    children.sort((a, b) => a.key - b.key || a.order - b.order);
    for (const child of children) {
      if (child.text) collectText(child.text, cs, vp, range, ops);
      else walk(child.el);
    }

    if (clips) ops.push({ op: 'restore' });
    ops.push({ op: 'restore' });
  };

  if (root === document.documentElement || root === document.body) {
    for (const child of document.body.children) walk(child);
  } else walk(root);
  range.detach?.();
  return { ops, assets };
}

/** True when drawing this source would taint the canvas (cross-origin without CORS). */
export function wouldTaint(source, cache = new Map()) {
  const key = source.currentSrc || source.src || source;
  if (cache.has(key)) return cache.get(key);
  let tainted = false;
  try {
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const ctx = probe.getContext('2d');
    ctx.drawImage(source, 0, 0, 1, 1);
    ctx.getImageData(0, 0, 1, 1);
  } catch {
    tainted = true;
  }
  cache.set(key, tainted);
  return tainted;
}

const metricsCache = new Map();
function baselineOffset(ctx, font, lineHeight) {
  let m = metricsCache.get(font);
  if (!m) {
    const measured = ctx.measureText('Hg');
    m = { ascent: measured.fontBoundingBoxAscent, descent: measured.fontBoundingBoxDescent };
    metricsCache.set(font, m);
  }
  // Centre the font's content area in the rect, which is what CSS layout does with half-leading.
  return (lineHeight - (m.ascent + m.descent)) / 2 + m.ascent;
}

function drawBackgroundImage(ctx, op, image) {
  const nw = image.naturalWidth || image.width;
  const nh = image.naturalHeight || image.height;
  if (!nw || !nh) return;
  const [sw, sh = 'auto'] = op.size.split(',')[0].trim().split(' ');
  let w;
  let h;
  if (sw === 'cover' || sw === 'contain') {
    const scale = (sw === 'cover' ? Math.max : Math.min)(op.w / nw, op.h / nh);
    w = nw * scale;
    h = nh * scale;
  } else {
    w = sw === 'auto' ? null : length(sw, op.w);
    h = sh === 'auto' ? null : length(sh, op.h);
    if (w === null && h === null) [w, h] = [nw, nh];
    else if (w === null) w = (h * nw) / nh;
    else if (h === null) h = (w * nh) / nw;
  }
  const [posX, posY] = op.position.split(',')[0].trim().split(' ');
  const x = op.x + positionOffset(posX, op.w - w);
  const y = op.y + positionOffset(posY, op.h - h);
  if (op.repeat.startsWith('no-repeat')) {
    ctx.drawImage(image, x, y, w, h);
    return;
  }
  const pattern = ctx.createPattern(image, 'repeat');
  pattern.setTransform(new DOMMatrix().translateSelf(x, y).scaleSelf(w / nw, h / nh));
  ctx.fillStyle = pattern;
  ctx.fillRect(op.x, op.y, op.w, op.h);
}

function paint(ctx, ops, { placeholderColor }, taintCache, stats) {
  for (const op of ops) {
    try {
      if (op.op === 'save') {
        ctx.save();
        if (op.alpha < 1) ctx.globalAlpha *= op.alpha;
        if (op.filter) ctx.filter = op.filter;
        if (op.blend) ctx.globalCompositeOperation = op.blend;
        if (op.clip) {
          boxPath(ctx, op.clip.x, op.clip.y, op.clip.w, op.clip.h, op.clip.radii);
          ctx.clip();
        }
      } else if (op.op === 'restore') {
        ctx.restore();
      } else if (op.op === 'box') {
        ctx.save();
        boxPath(ctx, op.x, op.y, op.w, op.h, op.radii);
        ctx.clip();
        if (op.bg) {
          ctx.fillStyle = op.bg;
          ctx.fillRect(op.x, op.y, op.w, op.h);
        }
        for (const layer of op.images) {
          if (layer.gradient) {
            const g = parseGradient(layer.gradient, op.w, op.h);
            if (!g) continue;
            ctx.fillStyle = canvasGradient(ctx, g, op.x, op.y, op.w, op.h);
            ctx.fillRect(op.x, op.y, op.w, op.h);
          } else if (layer.asset.ok) {
            if (wouldTaint(layer.asset.image, taintCache)) stats.tainted += 1;
            else drawBackgroundImage(ctx, op, layer.asset.image);
          }
        }
        ctx.restore();
        if (op.border) {
          ctx.strokeStyle = op.border.color;
          ctx.lineWidth = op.border.width;
          const half = op.border.width / 2;
          boxPath(ctx, op.x + half, op.y + half, op.w - op.border.width, op.h - op.border.width, op.radii?.map((r) => Math.max(0, r - half)));
          ctx.stroke();
        }
      } else if (op.op === 'text') {
        const { style } = op;
        ctx.font = style.font;
        ctx.letterSpacing = style.letterSpacing;
        ctx.fillStyle = style.color;
        ctx.textBaseline = 'alphabetic';
        const baseline = op.y + baselineOffset(ctx, style.font, op.h);
        ctx.fillText(op.text, op.x, baseline);
        if (style.underline) {
          const width = ctx.measureText(op.text).width;
          ctx.fillStyle = style.underline;
          ctx.fillRect(op.x, Math.round(baseline + Math.max(1, style.fontSize / 12)), width, Math.max(1, style.fontSize / 16));
        }
      } else if (op.op === 'image') {
        ctx.save();
        const m = op.matrix;
        ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
        if (op.radii) {
          boxPath(ctx, 0, 0, op.w, op.h, op.radii);
          ctx.clip();
        }
        const { source } = op;
        if (source.svg) {
          if (source.svg.ok) {
            const { margin } = source.svg;
            ctx.drawImage(source.svg.image, op.box.x - margin.x, op.box.y - margin.y, op.box.w + 2 * margin.x, op.box.h + 2 * margin.y);
          }
        } else if (source.placeholder || (source.element && wouldTaint(source.element, taintCache))) {
          if (!source.placeholder) stats.tainted += 1;
          ctx.fillStyle = placeholderColor;
          ctx.fillRect(op.box.x, op.box.y, op.box.w, op.box.h);
        } else {
          const el = source.element;
          const nw = el.naturalWidth ?? el.videoWidth ?? el.width;
          const nh = el.naturalHeight ?? el.videoHeight ?? el.height;
          const ready = el.tagName === 'IMG' ? el.complete && nw > 0 : el.tagName === 'VIDEO' ? el.readyState >= 2 : true;
          if (ready) {
            const fit = el.tagName === 'CANVAS' ? 'fill' : op.fit;
            const dest = fitRect(fit, op.box, nw, nh, op.position);
            if (fit === 'cover' || fit === 'none') {
              ctx.beginPath();
              ctx.rect(op.box.x, op.box.y, op.box.w, op.box.h);
              ctx.clip();
            }
            ctx.drawImage(el, dest.x, dest.y, dest.w, dest.h);
          }
        }
        ctx.restore();
      }
    } catch {
      // One bad primitive should not lose the whole frame.
    }
  }
}

/** The page's background colour (html, then body; white if neither sets one). */
export function pageBackground() {
  for (const el of [document.documentElement, document.body]) {
    const color = getComputedStyle(el).backgroundColor;
    if (!transparent(color)) return color;
  }
  return '#ffffff';
}

/**
 * Captures the visible viewport of the page at device pixel ratio.
 * @param {Element} root usually document.body
 * @param {{ width:number, height:number, dpr:number }} vp
 * @returns {Promise<{ canvas: HTMLCanvasElement, width:number, height:number, dpr:number, background:string, ms:number, tainted:number }>}
 */
export async function rasterize(root, vp, options = {}) {
  const start = performance.now();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(vp.width * vp.dpr);
  canvas.height = Math.round(vp.height * vp.dpr);
  const ctx = canvas.getContext('2d');
  const { ops, assets } = collect(root, vp, options);
  await Promise.all(
    assets.map((asset) =>
      asset.ready.then((ok) => {
        asset.ok = ok;
      }),
    ),
  );
  ctx.scale(vp.dpr, vp.dpr);
  const background = pageBackground();
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, vp.width, vp.height);
  const stats = { tainted: 0 };
  paint(ctx, ops, { placeholderColor: options.placeholderColor ?? '#808080' }, new Map(), stats);
  return { canvas, width: vp.width, height: vp.height, dpr: vp.dpr, background, ms: performance.now() - start, tainted: stats.tainted };
}
