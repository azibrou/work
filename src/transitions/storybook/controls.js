// Storybook controls for page transitions, shared by every story that uses the app shell.

import menu from '../../components/top-menu/menu.json';
import { DEFAULT_OPTIONS } from '../one-bit/options.js';
import { isOneBit } from '../transitionRules.js';

const D = DEFAULT_OPTIONS;
const duration = (category = 'Durations (ms)') => ({ control: { type: 'range', min: 0, max: 2000, step: 10 }, table: { category } });
const range = (min, max, step = 1) => ({ control: { type: 'range', min, max, step }, table: { category: 'Look' } });
const choice = (options, category = 'Behaviour', control = 'inline-radio') => ({ control, options, table: { category } });

export const transitionArgTypes = {
  oneBitItems: {
    name: '1-bit menu items',
    description: 'Top-navigation items that use the 1-bit desktop transition (Transition: 1-bit desktop under Components/Top navigation).',
    control: 'check',
    options: menu.items.map((item) => item.id),
    table: { category: 'Binding' },
  },
  oneBitToOneBit: { ...choice(['forward', 'none'], 'Binding'), description: 'What plays between two 1-bit pages.' },
  dither: { ...duration(), description: 'The page being left flips to 1-bit through a Bayer mask.' },
  out: { ...duration(), description: 'Its content disappears pixel by pixel while the background starts to fade.' },
  in: { ...duration(), description: 'The new content appears pixel by pixel while the background finishes its fade.' },
  undither: { ...duration(), description: 'Bayer cells turn the destination from 1-bit back to the live page.' },
  crossfade: { ...duration(), description: 'Used instead of the effect when motion is reduced.' },
  pixelSize: { ...range(1, 4), description: 'CSS px per 1-bit pixel.' },
  bayerCell: { ...range(2, 40), description: 'CSS px per Bayer mask cell.' },
  seed: { control: { type: 'number', min: 0, step: 1 }, table: { category: 'Look' }, description: 'Order pixels disappear and appear in.' },
  reducedMotion: { ...choice(['system', 'reduce', 'no-preference'], 'Accessibility', 'select'), description: '"reduce" simulates prefers-reduced-motion.' },
  reducedMotionMode: choice(['crossfade', 'instant'], 'Accessibility'),
  duringTransition: { ...choice(['queue', 'ignore', 'cancel']), description: 'A navigation while one is playing.' },
  imageTimeout: { control: { type: 'range', min: 0, max: 3000, step: 50 }, table: { category: 'Behaviour' } },
  entrance: { ...choice(['none', 'lines']), description: 'Extra entrance after the transition (terminal-style wipe).' },
  syncHistory: { control: 'boolean', table: { category: 'Behaviour' }, description: 'Mirror the page in the URL hash so browser back/forward work.' },
};

export const transitionArgs = {
  // Starts from menu.json; falls back to the last item so the effect can be tried.
  oneBitItems: menu.items.some(isOneBit) ? menu.items.filter(isOneBit).map((item) => item.id) : [menu.items.at(-1)?.id].filter(Boolean),
  oneBitToOneBit: D.oneBitToOneBit,
  ...D.durations,
  pixelSize: D.pixelSize,
  bayerCell: D.bayerCell,
  seed: D.seed,
  reducedMotion: D.reducedMotion,
  reducedMotionMode: D.reducedMotionMode,
  duringTransition: D.duringTransition,
  imageTimeout: D.imageTimeout,
  entrance: D.entrance,
  syncHistory: false,
};

const DURATION_KEYS = Object.keys(D.durations);
const SHELL_KEYS = new Set(['oneBitItems', 'syncHistory', ...DURATION_KEYS]);

/** Story args → options for createOneBitTransition / usePageTransitions. */
export function argsToOptions(args) {
  const all = { ...transitionArgs, ...args };
  const options = Object.fromEntries(Object.entries(all).filter(([key]) => !SHELL_KEYS.has(key) && key in transitionArgs));
  options.durations = Object.fromEntries(DURATION_KEYS.map((key) => [key, all[key]]));
  return options;
}
