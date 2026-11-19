import { z } from 'zod';
import { inventoryPolicySchema } from './inventory-policy.js';

// Sent by the client in the `Idempotency-Key` header, one per request draft.
export const idempotencyKeySchema = z.uuid();

const savedLineSchema = z.object({
  wineId: z.uuid(),
  quantity: z.number().int().positive(),
  available: z.number().int().nonnegative(),
  shortBy: z.number().int().nonnegative(),
});
export type SavedOrderLine = z.infer<typeof savedLineSchema>;

export const savedOrderRequestSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  policy: inventoryPolicySchema,
  lines: z.array(savedLineSchema),
});
export type SavedOrderRequest = z.infer<typeof savedOrderRequestSchema>;

// 201 for a new request, 200 with `duplicate: true` for a repeated key and body.
export const saveOrderRequestResponseSchema = savedOrderRequestSchema.extend({
  duplicate: z.boolean(),
});
export type SaveOrderRequestResponse = z.infer<
  typeof saveOrderRequestResponseSchema
>;

// 400: field path (for example `lines.0.quantity`) to its first message.
export const saveOrderRequestInvalidSchema = z.object({
  reason: z.literal('invalid_request'),
  fieldErrors: z.record(z.string(), z.string()),
});

// 422: the request is well formed but cannot be saved.
export const saveOrderRequestRejectedSchema = z.discriminatedUnion('reason', [
  z.object({ reason: z.literal('idempotency_key_reused') }),
  z.object({ reason: z.literal('unknown_customer') }),
  z.object({
    reason: z.literal('unknown_wines'),
    wineIds: z.array(z.uuid()),
  }),
  z.object({
    reason: z.literal('over_stock'),
    policy: inventoryPolicySchema,
    lines: z.array(savedLineSchema),
  }),
]);
export type SaveOrderRequestRejected = z.infer<
  typeof saveOrderRequestRejectedSchema
>;
