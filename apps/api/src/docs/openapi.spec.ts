import { z } from 'zod';
import { buildOpenApiDocument, toOpenApiPath } from './openapi.js';
import { route } from './route.js';

describe('toOpenApiPath', () => {
  it('turns route params into OpenAPI templates', () => {
    expect(toOpenApiPath('/customers/:id/orders/:orderId')).toBe(
      '/customers/{id}/orders/{orderId}',
    );
  });
});

describe('buildOpenApiDocument', () => {
  const doc = buildOpenApiDocument([
    route({
      method: 'put',
      path: '/things/:id',
      summary: 'Update a thing',
      request: {
        body: z.object({ name: z.string().default('x') }),
        headers: { 'Idempotency-Key': z.uuid() },
      },
      responses: {
        200: { description: 'ok', schema: z.object({ name: z.string() }) },
      },
    }),
    route({
      method: 'get',
      path: '/things/:id',
      summary: 'Get a thing',
      responses: { 200: { description: 'ok', schema: z.string() } },
    }),
  ]);
  const put = doc.paths['/things/{id}']?.put as any;

  it('puts methods of one path together', () => {
    expect(Object.keys(doc.paths['/things/{id}'] ?? {}).sort()).toEqual([
      'get',
      'put',
    ]);
  });

  it('lists path params and required headers as parameters', () => {
    expect(put.parameters).toMatchObject([
      { name: 'id', in: 'path', required: true },
      { name: 'Idempotency-Key', in: 'header', required: true },
    ]);
  });

  it('describes a body as input and a response as output', () => {
    // A defaulted field is optional in a request and always present in a response.
    expect(
      put.requestBody.content['application/json'].schema.required,
    ).toBeUndefined();
    expect(
      put.responses[200].content['application/json'].schema.required,
    ).toEqual(['name']);
  });

  it('leaves out requestBody when the route has none', () => {
    const get = doc.paths['/things/{id}']?.get as { requestBody?: unknown };
    expect(get.requestBody).toBeUndefined();
  });
});
