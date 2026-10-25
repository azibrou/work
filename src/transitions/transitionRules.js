// Which transition plays between two menu items. Pure.
//
//   destination has "one-bit", source doesn't → 'forward'
//   source has "one-bit", destination doesn't → 'reverse'
//   both have it                              → options.oneBitToOneBit ('forward' | 'none')
//   neither                                   → 'none'

import { DEFAULT_TRANSITION } from './registry.js';

export const ONE_BIT = 'one-bit';

export const isOneBit = (item) => item?.transition === ONE_BIT;

export function pickTransition(fromItem, toItem, { oneBitToOneBit = 'forward' } = {}) {
  const from = isOneBit(fromItem);
  const to = isOneBit(toItem);
  if (to && !from) return 'forward';
  if (from && !to) return 'reverse';
  if (from && to) return oneBitToOneBit;
  return 'none';
}

/** Menu items with the transition switched on for exactly the given ids (Storybook control). */
export function withOneBit(items, enabledIds) {
  const enabled = new Set(enabledIds);
  return items.map((item) => ({ ...item, transition: enabled.has(item.id) ? ONE_BIT : DEFAULT_TRANSITION }));
}
