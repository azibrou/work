import { describe, expect, it } from 'vitest';
import cards from '../src/components/home-cards/cards.json';
import { validateCard } from '../src/components/home-cards/cardSchema.js';
import { EXPLORING_CARDS } from '../src/components/home-cards/exploringCards.js';

describe('Exploring cards', () => {
  it.each(EXPLORING_CARDS)('%s has a valid saved config', (cardId) => {
    expect(cards).toHaveProperty(cardId);
    expect(validateCard(cards[cardId])).toEqual(cards[cardId]);
  });

  it('are the six projects, in order', () => {
    expect(EXPLORING_CARDS.map((id) => cards[id].title)).toEqual([
      'Home climate',
      'UV and Light sensor',
      'Trade study',
      'Synthesizer editor',
      'Stock map',
      'Atlas',
    ]);
  });
});
