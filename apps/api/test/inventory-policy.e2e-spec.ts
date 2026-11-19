import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';

describe('Inventory policy (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query(`DELETE FROM "settings"`);
    await dataSource.query(
      `INSERT INTO "settings" ("inventory_policy") VALUES ('strict')`,
    );
  });

  const server = () => request(app.getHttpServer());

  it('GET returns the policy and updatedAt', async () => {
    const res = await server().get('/settings/inventory-policy').expect(200);
    expect(res.body.policy).toBe('strict');
    expect(new Date(res.body.updatedAt).toISOString()).toBe(res.body.updatedAt);
  });

  it('PUT changes the policy and GET reflects it', async () => {
    const put = await server()
      .put('/settings/inventory-policy')
      .send({ policy: 'flexible' })
      .expect(200);
    expect(put.body.policy).toBe('flexible');
    const get = await server().get('/settings/inventory-policy').expect(200);
    expect(get.body).toEqual(put.body);
  });

  it.each([
    ['unknown value', { policy: 'lenient' }],
    ['wrong case', { policy: 'Strict' }],
    ['wrong type', { policy: 1 }],
    ['missing policy', {}],
  ])('PUT rejects %s with 400 and keeps the policy', async (_name, body) => {
    await server().put('/settings/inventory-policy').send(body).expect(400);
    const get = await server().get('/settings/inventory-policy').expect(200);
    expect(get.body.policy).toBe('strict');
  });

  it('PUT rejects an empty body with 400', async () => {
    await server().put('/settings/inventory-policy').expect(400);
  });

  it('fails with 500 and a clear message when the row is missing', async () => {
    await dataSource.query(`DELETE FROM "settings"`);
    const get = await server().get('/settings/inventory-policy').expect(500);
    expect(get.body.message).toMatch(/not configured/);
    await server()
      .put('/settings/inventory-policy')
      .send({ policy: 'strict' })
      .expect(500);
  });
});
