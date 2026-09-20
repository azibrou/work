import { describe, expect, it } from 'vitest';
import { checkApply } from '../src/tokens/useApplyCheck.js';
import { validateCard } from '../src/components/home-cards/cardSchema.js';
import cards from '../src/components/home-cards/cards.json';

describe('checkApply', () => {
  it.each(Object.keys(cards))('%s in cards.json can be applied', (id) => {
    expect(checkApply(validateCard, cards[id])).toEqual({ ok: true, error: '' });
  });

  it('reports why a change cannot be applied', () => {
    const result = checkApply(validateCard, { ...cards.mgh, width: 5 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Width/);
  });

  it('rejects a non-boolean visible flag', () => {
    expect(checkApply(validateCard, { ...cards.mgh, visible: 'yes' }).ok).toBe(false);
  });
});
