import type { z } from 'zod';

export type RouteDoc = {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  // Express style, as in the controller: `/customers/:id`.
  path: string;
  summary: string;
  request?: {
    body?: z.ZodType;
    // Header name to its schema; all are documented as required.
    headers?: Record<string, z.ZodType>;
  };
  // Status code to the schema of its JSON body.
  responses: Record<number, { description: string; schema: z.ZodType }>;
};

// Identity function: it only gives the registry files type checking.
export const route = (doc: RouteDoc): RouteDoc => doc;

// The 400 every endpoint with input returns, from the global pipe.
export const invalidRequestResponse = (schema: z.ZodType) => ({
  400: { description: 'Invalid request', schema },
});
