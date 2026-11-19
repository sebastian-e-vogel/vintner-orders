import { z } from 'zod';

export const inventoryPolicySchema = z.enum(['strict', 'flexible']);
export type InventoryPolicy = z.infer<typeof inventoryPolicySchema>;

export const updateInventoryPolicyRequestSchema = z.object({
  policy: inventoryPolicySchema,
});
export type UpdateInventoryPolicyRequest = z.infer<
  typeof updateInventoryPolicyRequestSchema
>;

export const inventoryPolicyResponseSchema = z.object({
  policy: inventoryPolicySchema,
  updatedAt: z.iso.datetime(),
});
export type InventoryPolicyResponse = z.infer<
  typeof inventoryPolicyResponseSchema
>;
