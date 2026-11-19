import { healthResponseSchema } from '@vintner/contracts';
import { route } from './docs/route.js';

export const healthDocs = [
  route({
    method: 'get',
    path: '/health',
    summary: 'Liveness check',
    responses: { 200: { description: 'OK', schema: healthResponseSchema } },
  }),
];
