import { INestApplication, RequestMethod } from '@nestjs/common';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants.js';
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
import { setupDocs, toOpenApiPath } from '../src/docs/openapi.js';

const joinPath = (...parts: string[]) =>
  '/' +
  parts
    .map((part) => part.replace(/^\/|\/$/g, ''))
    .filter(Boolean)
    .join('/');

describe('API docs (e2e)', () => {
  let app: INestApplication<App>;
  let spec: { paths: Record<string, Record<string, unknown>> };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule, DiscoveryModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    setupDocs(app);
    await app.init();
    spec = (await request(app.getHttpServer()).get('/docs/openapi.json')).body;
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
    const copy = structuredClone(spec);
    await expect(SwaggerParser.validate(copy as never)).resolves.toBeDefined();
    expect(spec).toMatchObject({ openapi: expect.stringMatching(/^3\./) });
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
        registered.push(
          `${RequestMethod[method].toLowerCase()} ${toOpenApiPath(joinPath(base, sub))}`,
        );
      }
    }
    const documented = Object.entries(spec.paths).flatMap(([path, ops]) =>
      Object.keys(ops).map((method) => `${method} ${path}`),
    );
    expect(registered.length).toBeGreaterThan(0);
    expect(documented.sort()).toEqual(registered.sort());
  });
});
