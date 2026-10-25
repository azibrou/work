// Page transitions a top-navigation item can use. "default" swaps the page with
// no animation. Add a transition here once it exists under Transitions in Storybook.
// Keep free of node/browser APIs: the save endpoint and the story generator read it too.

export const DEFAULT_TRANSITION = 'default';

export const TRANSITIONS = {
  default: { label: 'Default' },
  'one-bit': { label: '1-bit desktop' },
};

export const TRANSITION_IDS = Object.keys(TRANSITIONS);
export const TRANSITION_OPTIONS = TRANSITION_IDS.map((value) => ({ value, label: TRANSITIONS[value].label }));
