import { wineListSchema } from '@vintner/contracts';
import { route } from '../docs/route.js';

export const winesDocs = [
  route({
    method: 'get',
    path: '/wines',
    summary: 'List the wine catalog with available stock',
    responses: { 200: { description: 'Wines', schema: wineListSchema } },
  }),
];
