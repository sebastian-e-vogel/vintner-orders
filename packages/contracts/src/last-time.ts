import { z } from 'zod';
import { wineSchema } from './wine.js';

export const customerIdSchema = z.uuid();

const lastTimeItemSchema = z.object({
  quantity: z.number().int().positive(),
  wine: wineSchema,
});

export const lastTimeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('order'),
    at: z.iso.datetime(),
    salesRepName: z.string(),
    items: z.array(lastTimeItemSchema),
  }),
  z.object({
    kind: z.literal('request'),
    at: z.iso.datetime(),
    contactName: z.string(),
    items: z.array(lastTimeItemSchema),
  }),
]);
export type LastTime = z.infer<typeof lastTimeSchema>;

// A customer without history gets null.
export const lastTimeResponseSchema = lastTimeSchema.nullable();
