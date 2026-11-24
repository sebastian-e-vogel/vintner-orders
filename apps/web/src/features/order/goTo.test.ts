import { afterEach, describe, expect, it, vi } from 'vitest';
import { focusQuantity } from './goTo';

function setup(reducedMotion: boolean | undefined) {
  window.matchMedia =
    reducedMotion === undefined
      ? (undefined as never)
      : (vi.fn(() => ({ matches: reducedMotion })) as never);
  const input = document.createElement('input');
  input.value = '12';
  document.body.append(input);
  input.scrollIntoView = vi.fn();
  return input;
}

describe('focusQuantity', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('focuses, selects and scrolls smoothly to the centre', () => {
    const input = setup(false);
    focusQuantity(input);
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(2);
    expect(input.scrollIntoView).toHaveBeenCalledWith({
      block: 'center',
      behavior: 'smooth',
    });
  });

  it('scrolls instantly under reduced motion', () => {
    const input = setup(true);
    focusQuantity(input);
    expect(input.scrollIntoView).toHaveBeenCalledWith({
      block: 'center',
      behavior: 'instant',
    });
  });

  it('scrolls smoothly when matchMedia is missing', () => {
    const input = setup(undefined);
    focusQuantity(input);
    expect(input.scrollIntoView).toHaveBeenCalledWith({
      block: 'center',
      behavior: 'smooth',
    });
  });
});
