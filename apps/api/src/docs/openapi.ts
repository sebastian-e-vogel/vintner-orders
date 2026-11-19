import type { INestApplication } from '@nestjs/common';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { z } from 'zod';
import { routeDocs } from './routes.js';
import type { RouteDoc } from './route.js';

const toSchema = (schema: z.ZodType, io: 'input' | 'output') => {
  const { $schema: _ignored, ...json } = z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io,
  });
  return json;
};

// `/customers/:id` becomes `/customers/{id}`.
export const toOpenApiPath = (path: string) => path.replace(/:(\w+)/g, '{$1}');

const jsonContent = (schema: z.ZodType, io: 'input' | 'output') => ({
  'application/json': { schema: toSchema(schema, io) },
});

const operation = (doc: RouteDoc) => {
  const pathParams = [...doc.path.matchAll(/:(\w+)/g)].map((match) => ({
    name: match[1],
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }));
  const headers = Object.entries(doc.request?.headers ?? {}).map(
    ([name, schema]) => ({
      name,
      in: 'header',
      required: true,
      schema: toSchema(schema, 'input'),
    }),
  );
  return {
    summary: doc.summary,
    parameters: [...pathParams, ...headers],
    ...(doc.request?.body && {
      requestBody: {
        required: true,
        content: jsonContent(doc.request.body, 'input'),
      },
    }),
    responses: Object.fromEntries(
      Object.entries(doc.responses).map(([status, { description, schema }]) => [
        status,
        { description, content: jsonContent(schema, 'output') },
      ]),
    ),
  };
};

export const buildOpenApiDocument = (docs: RouteDoc[]) => {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const doc of docs) {
    (paths[toOpenApiPath(doc.path)] ??= {})[doc.method] = operation(doc);
  }
  return {
    openapi: '3.0.3',
    info: { title: 'Vintner Orders API', version: '0.0.1' },
    paths,
  };
};

// Called from main.ts and the e2e tests so both serve the same docs.
export const setupDocs = (app: INestApplication) =>
  SwaggerModule.setup(
    'docs',
    app,
    buildOpenApiDocument(routeDocs) as OpenAPIObject,
    { jsonDocumentUrl: 'docs/openapi.json' },
  );
