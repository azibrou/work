import { useEffect, useLayoutEffect, useState } from 'react';
import { AppShell } from '../storybook/AppShell.jsx';
import { Scrubber } from '../storybook/Scrubber.jsx';
import { transitionArgs, transitionArgTypes } from '../storybook/controls.js';
import Page from '../../pages/Page.jsx';
import coverImage from '../../images/cover.png';
import menu from '../../components/top-menu/menu.json';

// Test pages that stand in for real ones, to try the transition in hard cases.
// Pick one with the "Test page" control. Mobile: use the viewport toolbar.
// Reduced motion and 1-bit → 1-bit: use the Accessibility and Binding controls.
const TEST_PAGES = {
  none: 'Real pages',
  slow: 'Slow destination (1-bit pages load late)',
  scrolled: 'Long scrolled page (Doing, scrolled down)',
  dark: 'Dark source page (Doing on a dark background)',
};

// The destination marks itself not ready for 1.5 s (data-onebit-pending) and
// its image arrives late. The transition holds on a blank background for at most
// imageTimeout, then goes ahead with whatever is painted.
function SlowPage() {
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState(null);
  useEffect(() => {
    const image = setTimeout(() => setSrc(coverImage), 900);
    const data = setTimeout(() => setLoaded(true), 1500);
    return () => {
      clearTimeout(image);
      clearTimeout(data);
    };
  }, []);
  return (
    <div data-onebit-pending={loaded ? undefined : ''} style={{ textAlign: 'center', padding: 48 }}>
      <h1>{loaded ? 'Loaded' : 'Loading…'}</h1>
      <p>Content and image arrive after the transition has started.</p>
      {src && <img src={src} alt="Late cover" style={{ width: 480, marginTop: 24 }} />}
    </div>
  );
}

// Scrolled down the project page: only the visible viewport is captured and
// the destination starts at the top (scrollReset: 'top').
function ScrolledPage() {
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => window.scrollTo(0, 900));
    return () => cancelAnimationFrame(id);
  }, []);
  return <Page id="doing" />;
}

// A dark source page: the dither keeps the light ink and dark paper of the original.
function DarkPage() {
  useLayoutEffect(() => {
    const { style } = document.body;
    const before = style.background;
    style.background = '#121415';
    return () => {
      style.background = before;
    };
  }, []);
  return (
    <div style={{ '--color-text': '#f4f4f4', color: '#f4f4f4' }}>
      <Page id="doing" />
    </div>
  );
}

const pageOf = (itemId) => menu.items.find((item) => item.id === itemId)?.page;

function testPages(args) {
  if (args.testPage === 'slow') return Object.fromEntries(args.oneBitItems.map((id) => [pageOf(id), () => <SlowPage />]));
  if (args.testPage === 'scrolled') return { doing: () => <ScrolledPage /> };
  if (args.testPage === 'dark') return { doing: () => <DarkPage /> };
  return {};
}

const meta = {
  title: 'Transitions/1-bit desktop',
  parameters: { layout: 'fullscreen' },
  argTypes: {
    ...transitionArgTypes,
    testPage: {
      name: 'Test page',
      control: 'select',
      options: Object.keys(TEST_PAGES),
      labels: TEST_PAGES,
      table: { category: 'Binding' },
      description: 'Swap a page for a test case.',
    },
  },
  args: { ...transitionArgs, testPage: 'none' },
  render: (args) => <AppShell key={args.testPage} args={args} pages={testPages(args)} />,
};

export default meta;

// Click the menu, or use the toolbar. Pick which items are 1-bit under "Binding".
export const Playground = {};

// Drag the slider to see any frame. Same seed → same frame.
export const Scrubber_ = {
  name: 'Scrubber',
  args: { mode: 'forward', progress: 0.3 },
  argTypes: {
    mode: { control: 'inline-radio', options: ['forward', 'reverse', 'between 1-bit pages', 'crossfade'], table: { category: 'Scrubber' } },
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 }, table: { category: 'Scrubber' } },
  },
  render: (args) => <Scrubber args={args} />,
};

