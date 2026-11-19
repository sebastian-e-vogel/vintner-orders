import { customerListSchema } from '@vintner/contracts';
import { route } from '../docs/route.js';

export const customersDocs = [
  route({
    method: 'get',
    path: '/customers',
    summary: 'List customers',
    responses: {
      200: { description: 'Customers', schema: customerListSchema },
    },
  }),
];
