import { useCallback, useEffect, useId, useRef, useState } from 'react';
import './book-shelf.css';
import shelf from './shelf.json';
import BookCover from './BookCover.jsx';
import { targetScroll } from './scroll.js';
import { FONT_VARS } from '../home-cards/cardSchema.js';

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Whether there are covers hidden off either edge of the track.
// An arrow that disappears while focused would drop focus to the page, so
// before it goes, focus moves to the other arrow (or the track itself).
function useOverflow(trackRef, prevRef, nextRef, count) {
  const [edges, setEdges] = useState({ prev: false, next: false });
  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const prev = el.scrollLeft > 1;
    const next = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    const active = document.activeElement;
    if (!prev && active && active === prevRef.current) (nextRef.current ?? el).focus({ preventScroll: true });
    if (!next && active && active === nextRef.current) (prevRef.current ?? el).focus({ preventScroll: true });
    setEdges((old) => (old.prev === prev && old.next === next ? old : { prev, next }));
  }, [trackRef, prevRef, nextRef]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [trackRef, update, count]);

  return edges;
}

function Arrow({ dir }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d={dir < 0 ? 'M12.5 4.5 7 10l5.5 5.5' : 'M7.5 4.5 13 10l-5.5 5.5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A headline over a row of book covers that scrolls sideways. Arrow buttons
// appear on a side only while covers are hidden past that edge. Content comes
// from shelf.json, edited in Storybook under Components/Book Shelf.
export default function BookShelf(props) {
  const { headline, headlineFont, headlineSize, headlineColor, scrollStep, books } = { ...shelf, ...props };
  const trackRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const { prev, next } = useOverflow(trackRef, prevRef, nextRef, books.length);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const covers = [...el.children];
    const starts = covers.map((c) => c.offsetLeft - el.firstElementChild.offsetLeft);
    const width = covers[0]?.offsetWidth ?? 1;
    const gap = covers.length > 1 ? starts[1] - starts[0] - width : 0;
    const visible = Math.floor((el.clientWidth + gap) / (width + gap));
    const left = targetScroll({ starts, scrollLeft: el.scrollLeft, maxScroll: el.scrollWidth - el.clientWidth, visible, dir, step: scrollStep });
    el.scrollTo({ left, behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  const headingId = useId();

  return (
    <section className="book-shelf" aria-labelledby={headingId}>
      {/* Always an <h2> under the page's memo <h1>; the size setting only picks the look. */}
      <h2
        id={headingId}
        className="book-shelf__headline"
        style={{
          fontFamily: FONT_VARS[headlineFont],
          fontSize: `var(--font-size-${headlineSize})`,
          lineHeight: `var(--line-height-${headlineSize})`,
          fontWeight: `var(--font-weight-${headlineSize})`,
          color: `var(${headlineColor})`,
        }}
      >
        {headline}
      </h2>
      <div className="book-shelf__viewport">
        {/* Focusable so keyboard users can scroll it with the arrow keys. */}
        <ul ref={trackRef} className="book-shelf__track" tabIndex={0} aria-label={`${headline}, scrolls sideways`}>
          {books.map((book) => (
            <BookCover key={book.id} as="li" title={book.title} />
          ))}
        </ul>
        {prev && (
          <button ref={prevRef} type="button" className="book-shelf__arrow book-shelf__arrow--prev" aria-label="Scroll back" onClick={() => scroll(-1)}>
            <Arrow dir={-1} />
          </button>
        )}
        {next && (
          <button ref={nextRef} type="button" className="book-shelf__arrow book-shelf__arrow--next" aria-label="Scroll forward" onClick={() => scroll(1)}>
            <Arrow dir={1} />
          </button>
        )}
      </div>
    </section>
  );
}
