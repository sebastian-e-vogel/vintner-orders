import { z } from 'zod';
import { inventoryPolicySchema } from './inventory-policy.js';
import { wineSchema } from './wine.js';

const savedRequestLineSchema = z.object({
  // `available` is today's stock; the line keeps the stock seen at save time.
  wine: wineSchema.omit({ available: true }),
  quantity: z.number().int().positive(),
  availableAtSave: z.number().int().nonnegative(),
  shortBy: z.number().int().nonnegative(),
});

export const savedRequestListItemSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  policy: inventoryPolicySchema,
  contactName: z.string(),
  phone: z.string(),
  notes: z.string(),
  salesRepName: z.string(),
  customer: z.object({ name: z.string(), contactName: z.string() }),
  lines: z.array(savedRequestLineSchema),
});
export type SavedRequestListItem = z.infer<typeof savedRequestListItemSchema>;

export const savedRequestListSchema = z.array(savedRequestListItemSchema);

export const savedRequestCountSchema = z.object({
  count: z.number().int().nonnegative(),
});
export type SavedRequestCount = z.infer<typeof savedRequestCountSchema>;
