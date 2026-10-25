import { useEffect, useRef, useState } from 'react';
import './memo.css';
import library from './memo.json';
import { FONT_VARS, memoForPage } from './memoSchema.js';

// True while the element is on screen. Starts false so the memo begins in its
// start position and animates in as soon as the first check finds it visible.
function useInView(ref) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

// The intro block at the top of a page. Takes one memo's settings as props
// (defaults to the first memo in memo.json); edited in Storybook under Components/Memo.
export default function Memo(props) {
  const {
    headline,
    headlineFont,
    headlineSize,
    headlineColor,
    description,
    descriptionFont,
    descriptionSize,
    descriptionColor,
    enterDuration,
    enterDistance,
  } = { ...library.memos[0], ...props };
  const ref = useRef(null);
  const inView = useInView(ref);

  return (
    // The outer block is what we watch; only the inner one moves, so the
    // animation never changes whether the memo counts as on screen.
    <div
      ref={ref}
      className="memo"
      style={{ '--memo-enter-duration': `${enterDuration}ms`, '--memo-enter-distance': `${enterDistance}px` }}
    >
      <div className={`memo__content${inView ? ' is-in' : ''}`}>
        {/* Always an <h1>: the page needs exactly one. The size setting only picks the type scale. */}
        <h1
          style={{
            fontFamily: FONT_VARS[headlineFont],
            // Size goes through variables so memo.css can scale it down on phones.
            '--memo-headline-size': `var(--font-size-${headlineSize})`,
            '--memo-headline-line': `var(--line-height-${headlineSize})`,
            fontWeight: `var(--font-weight-${headlineSize})`,
            color: `var(${headlineColor})`,
          }}
        >
          {headline}
        </h1>
        <p
          className="memo-intro"
          style={{
            fontFamily: FONT_VARS[descriptionFont],
            fontSize: `var(--font-size-body-${descriptionSize})`,
            lineHeight: `var(--line-height-body-${descriptionSize})`,
            color: `var(${descriptionColor})`,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

// The memo assigned to a page under Components/Memo in Storybook, or nothing.
export function PageMemo({ pageId }) {
  const memo = memoForPage(library, pageId);
  return memo ? <Memo key={memo.id} {...memo} /> : null;
}
