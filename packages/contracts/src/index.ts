import { z } from 'zod';

// Placeholder that proves the package wiring; replaced by the real schemas.
export const pingSchema = z.object({ message: z.string().min(1) });
export type Ping = z.infer<typeof pingSchema>;

export * from './inventory-policy.js';
export * from './wine.js';

export const customerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  contactName: z.string(),
  email: z.string(),
  phone: z.string(),
});
export type Customer = z.infer<typeof customerSchema>;

export const customerListSchema = z.array(customerSchema);
export * from './order-request.js';
export * from './save-order-request.js';
export * from './saved-order-requests.js';
export * from './last-time.js';
export * from './health.js';
