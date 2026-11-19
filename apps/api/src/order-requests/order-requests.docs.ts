import {
  idempotencyKeySchema,
  orderRequestSchema,
  saveOrderRequestInvalidSchema,
  saveOrderRequestRejectedSchema,
  saveOrderRequestResponseSchema,
} from '@vintner/contracts';
import { invalidRequestResponse, route } from '../docs/route.js';

export const orderRequestsDocs = [
  route({
    method: 'post',
    path: '/order-requests',
    summary: 'Save an order request',
    request: {
      body: orderRequestSchema,
      headers: { 'Idempotency-Key': idempotencyKeySchema },
    },
    responses: {
      200: {
        description: 'Repeated key and body (`duplicate: true`)',
        schema: saveOrderRequestResponseSchema,
      },
      201: {
        description: 'Saved',
        schema: saveOrderRequestResponseSchema,
      },
      ...invalidRequestResponse(saveOrderRequestInvalidSchema),
      422: {
        description: 'Well formed but cannot be saved',
        schema: saveOrderRequestRejectedSchema,
      },
    },
  }),
];
