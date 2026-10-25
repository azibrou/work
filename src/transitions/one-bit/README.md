# 1-bit desktop transition

A page transition inspired by the 1984 Macintosh. Entering a 1-bit page:

1. The current page is captured and flips to 1-bit (Atkinson dither) cell by cell through a Bayer mask.
2. **Out:** its content disappears pixel by pixel, in a random order, until only the background is left.
3. **In:** only then does the new page's content appear, pixel by pixel. The new page is captured and dithered the same way.
4. The same Bayer mask turns the new page from 1-bit back into the live page.

The two pages never share the screen. The background moves from the old page's tone to the new page's (light to dark, entering a 1-bit page) in one smooth ease across steps 2 and 3, with no flash or jump. Leaving a 1-bit page plays the same timeline backwards.

## Enable it on a page

Set `"transition": "one-bit"` on the item in `src/components/top-menu/menu.json`:

```json
{ "id": "writing", "label": "Writing", "page": "writing", "transition": "one-bit" }
```

Or pick **Transition: 1-bit desktop** for the item in Storybook under *Components/Top navigation*, then click Apply. Page components need no changes. The transition only animates; the page's look (for example the white-on-black Geek theme) is the page's theme, set under *Pages*. New transitions are listed in `src/transitions/registry.js`.

The rule for what plays:

| From → To | Plays |
| --- | --- |
| plain → 1-bit | forward |
| 1-bit → plain | reverse |
| 1-bit → 1-bit | `oneBitToOneBit`: `forward` (the same transition, default) or `none` |
| plain → plain | nothing |

Any navigation counts: menu clicks, `#id` links, browser back/forward (the page is mirrored in the URL hash), and `navigate()` calls.

## Files

| File | What it does |
| --- | --- |
| `oneBitTransition.js` | `createOneBitTransition(options)` → `{ play, enter, exit, cancel, capture, preview }`. Framework-agnostic. |
| `atkinson.js`, `bayer.js`, `dissolve.js`, `timeline.js` | Pure units, unit-tested in `tests/oneBit.test.js`. |
| `rasterize.js` | DOM → canvas capture of the visible viewport. |
| `render.js` | Draws one frame from precomputed assets. Deterministic. |
| `one-bit.css` | The line-by-line entrance. |
| `../usePageTransitions.js` | React adapter. It owns the active page, holds the swap until the overlay covers the screen, and handles history, focus, and announcements. |
| `../transitionRules.js` | `pickTransition(from, to)`. |
| `../storybook/*` | App shell, controls, and scrubber. |

### Core API

```js
const transition = createOneBitTransition({ seed: 7 });
await transition.enter({
  commit: () => showNewPage(),          // called once, under the overlay
  incomingRoot: () => document.querySelector('main'),
});
```

`exit` and `play(mode, context)` take the same context. `cancel()` (or Escape) jumps to the end: it commits if needed and removes the overlay.

`preview({ outgoing, incoming, mode })` returns `{ renderAt(progress), timeline, destroy }`. It takes two `capture()` results, and the scrubber uses it.

## Options

| Option | Default | |
| --- | --- | --- |
| `durations.dither` | 450 | source flips to 1-bit through the Bayer mask, ms |
| `durations.out` | 500 | old content disappears pixel by pixel; the background starts its fade |
| `durations.in` | 500 | new content appears pixel by pixel; the background finishes its fade |
| `durations.undither` | 450 | destination goes from 1-bit back to the live page through the same mask |
| `durations.crossfade` | 150 | used under reduced motion |
| `pixelSize` | 2 | CSS px per 1-bit pixel (1–4) |
| `bayerCell` | 10 | CSS px per Bayer cell |
| `seed` | 1984 | order pixels disappear and appear in |
| `maxDpr` | 2 | capture resolution cap |
| `reducedMotion` | `'system'` | `'reduce'` forces it, `'no-preference'` ignores the OS |
| `reducedMotionMode` | `'crossfade'` | or `'instant'` |
| `oneBitToOneBit` | `'forward'` | see table above |
| `duringTransition` | `'queue'` | a new navigation mid-transition: `'queue'` (latest wins), `'ignore'`, `'cancel'`. Back/forward is never ignored. |
| `cancelOnEscape` | true | |
| `imageTimeout` | 400 | ms to wait for the new page's visible images and `data-onebit-pending` |
| `fontTimeout` | 2000 | ms to wait for `document.fonts.ready` |
| `scrollReset` | `'top'` | `'preserve'` keeps scroll position |
| `ignoreSelector` | `[data-onebit-ignore]` | left out of the capture |
| `placeholderColor` | `#808080` | drawn for cross-origin images that would taint the canvas |
| `rasterize` | null | custom capture: `async (root, viewport) => canvas` (e.g. a DOM-to-canvas library) |
| `entrance` | `'none'` | adapter: an extra terminal-style wipe after the transition (`'lines'`). With it on, the page's content is hidden while it's captured, so it shows only through the wipe |
| `entranceDuration` / `entranceSteps` | 700 / 14 | |
| `focus` | `'heading'` | adapter: after a transition focus goes to the page's first h1/h2; `'main'` or `'none'` |

## How it fits the app

The app has no router. The page is the active top-menu id in React state. `usePageTransitions` owns that state:

- **Forward:** the page swaps (`flushSync`) once the dither covers the screen. Its background colour is read right away, so the background fade knows where it's going. While the old content disappears, the new page is waited for (fonts, images), captured and dithered. If that isn't done when new content should start appearing, the timeline holds on the plain background.
- **Reverse:** the same, mirrored. The page being left turns 1-bit over the live page first, then the page swaps, and the new page is captured before its content appears.
- **Crossfade (reduced motion):** a pixel-aligned capture of the current page covers the screen, the page swaps underneath, and the capture fades away.
- **The rest:** the page sets `aria-busy` on `<main>` while a transition plays. Afterwards it moves focus, announces the page in a `role="status"` region, and fires a `pagetransition:finished` event.

One `requestAnimationFrame` loop drives every phase. There are no timeouts between phases. A frame never advances more than 50 ms, so a long frame never skips a whole phase.

Pages can mark themselves not ready with a `data-onebit-pending` attribute. The transition waits for it to go, up to `imageTimeout`.

The View Transitions API isn't used. It can't hold the swap until an arbitrary canvas animation reaches a point, and the canvas is the source of truth anyway.

## Background and content

Each 1-bit image is split into background and content. The background is the page's own background colour, read from CSS: dark (`0`) or light (`255`), split at the same luma threshold as the dither. The content is every pixel that differs from it. That's why the old content can fully disappear before the new one appears: during **out**, content pixels turn into background; during **in**, new content pixels are drawn on it. The background itself is one gray level for the whole screen, eased across both steps.

## Capture strategy

The capture is a custom rasterizer, option (b). The pages are built from a known set of primitives:

- text
- `<img>` and inline `<svg>`
- solid, linear-gradient, and `url()` backgrounds
- rounded `overflow: hidden` cards
- CSS transforms

Drawing those directly is faster than a generic DOM-to-canvas library, and text is exact. Each word is drawn at the rect the browser laid it out at, in the computed font, after `document.fonts.ready`. Every rect and style is read in one pass before painting, and none during animation.

Measured in Chromium at 1440×900, DPR 2:
- **Capture:** 5–15 ms warm, around 60 ms on the very first run (decoding the SVGs).
- **Dither:** about 30–40 ms.

So capture plus dither is under the 80 ms budget once warm. The first transition after page load can go slightly over. The dither runs on the GPU-downsampled buffer, not full resolution, and doesn't need a worker at this size.

To plug in a library for unknown content, pass `rasterize`.

## Known limitations

- The rasterizer skips box-shadows, `::before`/`::after` content, text-shadow, `background-clip: text`, and 3D transforms. Radial gradients are approximated as centred circles. Rotated or scaled ancestors are only handled for the element's own transform.
- An inline SVG that spills outside its box is drawn with a 50% margin. Anything further out is clipped.
- Iframes, `<object>`, and `<embed>` become placeholder blocks.
- CSS animations on the live page keep running under the see-through parts of the Bayer phases. A page element still mid-animation when it's captured (e.g. the memo slide-in) can differ slightly from its 1-bit image while the cells reveal it.
- A resize mid-transition finishes at the old size and then snaps to the live page.
- The scrubber is deterministic for given captures. Re-capturing an animated page (e.g. the MGH blobs, which start at a random phase) gives slightly different source images.
