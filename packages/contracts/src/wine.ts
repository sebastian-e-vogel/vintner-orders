import { z } from 'zod';

export const wineSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  producer: z.string(),
  // Null for non-vintage wines.
  vintage: z.number().int().nullable(),
  format: z.string(),
  sku: z.string(),
  available: z.number().int().nonnegative(),
});
export type Wine = z.infer<typeof wineSchema>;

export const wineListSchema = z.array(wineSchema);
