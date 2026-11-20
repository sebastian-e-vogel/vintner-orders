import { INestApplication, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';
import {
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
} from '@nestjs/core';
import { Test } from '@nestjs/testing';
import SwaggerParser from '@apidevtools/swagger-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { setupDocs } from '../src/docs/setup-docs.js';

type Operation = {
  parameters?: { name: string; in: string }[];
  requestBody?: unknown;
  responses: Record<string, { content?: Record<string, unknown> }>;
};
type Spec = {
  openapi: string;
  paths: Record<string, Record<string, Operation>>;
};

const joinPath = (...parts: string[]) =>
  '/' +
  parts
    .map((part) => part.replace(/^\/|\/$/g, ''))
    .filter(Boolean)
    .join('/');

describe('API docs (e2e)', () => {
  let app: INestApplication<App>;
  let spec: Spec;
  let operations: [string, Operation][];

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule, DiscoveryModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    setupDocs(app);
    await app.init();
    spec = (await request(app.getHttpServer()).get('/docs/openapi.json')).body;
    operations = Object.entries(spec.paths).flatMap(([path, ops]) =>
      Object.entries(ops).map(([method, op]): [string, Operation] => [
        `${method} ${path}`,
        op,
      ]),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves Swagger UI at /docs', async () => {
    const res = await request(app.getHttpServer()).get('/docs').redirects(1);
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });

  it('serves a valid OpenAPI 3 document', async () => {
    expect(spec.openapi).toMatch(/^3\./);
    await expect(
      SwaggerParser.validate(structuredClone(spec) as never),
    ).resolves.toBeDefined();
  });

  it('lists every registered route, and nothing else', () => {
    const scanner = app.get(MetadataScanner);
    const registered: string[] = [];
    for (const { metatype, instance } of app
      .get(DiscoveryService)
      .getControllers()) {
      if (!metatype || !instance) continue;
      const base = Reflect.getMetadata(PATH_METADATA, metatype) as string;
      for (const name of scanner.getAllMethodNames(
        Object.getPrototypeOf(instance),
      )) {
        const handler = instance[name];
        const method = Reflect.getMetadata(METHOD_METADATA, handler) as
          RequestMethod | undefined;
        if (method === undefined) continue;
        const sub = Reflect.getMetadata(PATH_METADATA, handler) as string;
        const path = joinPath(base, sub).replace(/:(\w+)/g, '{$1}');
        registered.push(`${RequestMethod[method].toLowerCase()} ${path}`);
      }
    }
    expect(registered.length).toBeGreaterThan(0);
    expect(operations.map(([name]) => name).sort()).toEqual(registered.sort());
  });

  // A handler without @ApiResponse still appears in the spec, but with no schema.
  it('gives every operation a 2xx response with a schema', () => {
    const missing = operations
      .filter(
        ([, op]) =>
          !Object.entries(op.responses).some(
            ([status, response]) =>
              status.startsWith('2') && response.content !== undefined,
          ),
      )
      .map(([name]) => name);
    expect(missing).toEqual([]);
  });

  it('documents the 400 on every operation that takes input', () => {
    const missing = operations
      .filter(
        ([, op]) =>
          (op.requestBody !== undefined || op.parameters?.length) &&
          op.responses['400']?.content === undefined,
      )
      .map(([name]) => name);
    expect(missing).toEqual([]);
  });

  it('documents the Idempotency-Key header of POST /order-requests', () => {
    const post = spec.paths['/order-requests']?.post;
    expect(post?.parameters).toContainEqual(
      expect.objectContaining({ name: 'Idempotency-Key', in: 'header' }),
    );
  });
});
