// Pure scroll math for the book shelf, kept apart so it can be tested without a browser.

// Where the track should scroll to for one press of prev (-1) or next (+1):
// the next cover start past the current position in that direction, then
// further covers for "page" steps (one per cover in view).
export function targetScroll({ starts, scrollLeft, maxScroll, visible, dir, step }) {
  const extra = step === 'page' ? Math.max(1, visible) - 1 : 0;
  let index;
  if (dir > 0) {
    index = starts.findIndex((left) => left > scrollLeft + 1);
    index = index === -1 ? starts.length - 1 : index + extra;
  } else {
    index = starts.findLastIndex((left) => left < scrollLeft - 1);
    index = index === -1 ? 0 : index - extra;
  }
  index = Math.min(starts.length - 1, Math.max(0, index));
  return Math.min(maxScroll, Math.max(0, starts[index]));
}
