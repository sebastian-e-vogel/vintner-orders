import { z } from 'zod';
import type { InventoryPolicy } from './inventory-policy.js';

export const MAX_LINE_QUANTITY = 999;
export const MIN_PHONE_DIGITS = 7;

export type OrderLine = { wineId: string; quantity: number };

// Sums quantities per wine, keeping the order in which each wine first appeared.
export function combineLines(lines: OrderLine[]): OrderLine[] {
  const totals = new Map<string, number>();
  for (const { wineId, quantity } of lines) {
    totals.set(wineId, (totals.get(wineId) ?? 0) + quantity);
  }
  return [...totals].map(([wineId, quantity]) => ({ wineId, quantity }));
}

const quantityMessage = `Quantity must be a whole number from 1 to ${MAX_LINE_QUANTITY}.`;

const orderLineSchema = z.object({
  wineId: z.uuid('Choose a wine.'),
  quantity: z
    .number(quantityMessage)
    .int(quantityMessage)
    .min(1, quantityMessage)
    .max(MAX_LINE_QUANTITY, quantityMessage),
});

export const orderRequestSchema = z.object({
  customerId: z.uuid('Choose a customer.'),
  contactName: z
    .string()
    .trim()
    .min(1, "Enter the caller's name.")
    .max(100, "The caller's name can be at most 100 characters."),
  phone: z
    .string()
    .trim()
    .min(1, { error: "Enter the caller's phone number.", abort: true })
    .max(30, { error: 'Phone can be at most 30 characters.', abort: true })
    .regex(/^\+?[\d -]+$/, {
      error: 'Use only digits, spaces, hyphens and a leading +.',
      abort: true,
    })
    .refine(
      (value) => value.replace(/\D/g, '').length >= MIN_PHONE_DIGITS,
      `Phone needs at least ${MIN_PHONE_DIGITS} digits.`,
    ),
  notes: z
    .string()
    .trim()
    .max(500, 'Notes can be at most 500 characters.')
    .default(''),
  lines: z
    .array(orderLineSchema)
    .min(1, 'Add at least one wine.')
    .transform(combineLines)
    .refine(
      (lines) => lines.every((line) => line.quantity <= MAX_LINE_QUANTITY),
      `The total for one wine can be at most ${MAX_LINE_QUANTITY}. Lower the quantity.`,
    ),
});

export type OrderRequestInput = z.input<typeof orderRequestSchema>;
export type OrderRequest = z.output<typeof orderRequestSchema>;

export type StockLine = OrderLine & { available: number; shortBy: number };

// A wine missing from the map counts as 0 available; whether it exists is a
// separate server check.
export function checkStock(
  lines: OrderLine[],
  availableByWineId: Record<string, number>,
  policy: InventoryPolicy,
): { lines: StockLine[]; canSave: boolean } {
  const checked = combineLines(lines).map(({ wineId, quantity }) => {
    const available = availableByWineId[wineId] ?? 0;
    return {
      wineId,
      quantity,
      available,
      shortBy: Math.max(0, quantity - available),
    };
  });
  const canSave =
    policy === 'flexible' || checked.every((line) => line.shortBy === 0);
  return { lines: checked, canSave };
}
