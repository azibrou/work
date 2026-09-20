import { describe, expect, it } from 'vitest';
import { cardArgTypes } from '../src/components/home-cards/cardControls.js';
import * as defaults from '../src/components/home-cards/cardDefaults.js';

const HEADLINES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

describe('cardArgTypes', () => {
  it('uses a color picker for solid-color cards', () => {
    const { background, hoverBackground } = cardArgTypes();
    expect(background.control).toBe('color');
    expect(hoverBackground.control).toBe('color');
  });

  it('uses text inputs for gradient cards', () => {
    const { background, hoverBackground } = cardArgTypes({ gradient: true });
    expect(background.control).toBe('text');
    expect(hoverBackground.control).toBe('text');
  });

  it('offers h1-h6 headline types', () => {
    expect(cardArgTypes().headlineType.options).toEqual(HEADLINES);
  });

  it('exposes a control for every editable default', () => {
    const argTypes = cardArgTypes();
    for (const card of Object.values(defaults)) {
      for (const key of Object.keys(card)) expect(argTypes).toHaveProperty(key);
    }
  });
});

describe('cardDefaults', () => {
  it.each(Object.entries(defaults))('%s has complete, valid values', (_name, card) => {
    expect(card.title).toBeTruthy();
    expect(card.description).toBeTruthy();
    expect(card.background).toBeTruthy();
    expect(card.hoverBackground).toBeTruthy();
    expect(HEADLINES).toContain(card.headlineType);
    expect(card.radius).toBeGreaterThanOrEqual(0);
    expect(card.hoverRadius).toBeGreaterThanOrEqual(0);
  });
});
