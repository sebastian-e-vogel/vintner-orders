import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { maxQuantity, parseQuantity } from './quantity';

export type LineStatusTone = 'quiet' | 'ok' | 'warning' | 'error';

export type LineStatus = {
  tone: LineStatusTone;
  text: string;
  // Set when a strict over-stock line can be fixed by lowering it to this amount.
  setTo?: number;
};

type LineStatusInput = {
  quantityText: string;
  available: number;
  policy: InventoryPolicy;
};

export function getLineStatus({
  quantityText,
  available,
  policy,
}: LineStatusInput): LineStatus {
  if (quantityText === '') return { tone: 'quiet', text: 'Enter a quantity' };

  const quantity = parseQuantity(quantityText);
  if (quantity === null) {
    return {
      tone: 'error',
      text: `Quantity must be a whole number from 1 to ${maxQuantity}.`,
    };
  }
  if (quantity <= available) return { tone: 'ok', text: 'Within stock' };

  if (policy === 'flexible') {
    return {
      tone: 'warning',
      text: `Short by ${quantity - available} — kept, flagged for reviewer`,
    };
  }
  if (available === 0) {
    return {
      tone: 'error',
      text: 'Out of stock — remove to save (strict)',
    };
  }
  return {
    tone: 'error',
    text: `Over stock by ${quantity - available} — max ${available} (strict)`,
    setTo: available,
  };
}

export const blockedStatus: LineStatus = {
  tone: 'error',
  text: "Can't order — out of stock (strict)",
};
