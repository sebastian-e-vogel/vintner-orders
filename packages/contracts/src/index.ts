import { z } from 'zod';

// Placeholder that proves the package wiring; replaced by the real schemas.
export const pingSchema = z.object({ message: z.string().min(1) });
export type Ping = z.infer<typeof pingSchema>;

export * from './inventory-policy.js';

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

export const customerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  contactName: z.string(),
  email: z.string(),
  phone: z.string(),
});
export type Customer = z.infer<typeof customerSchema>;

export const customerListSchema = z.array(customerSchema);
