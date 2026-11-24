import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  savedRequestCountSchema,
  savedRequestListSchema,
} from '@vintner/contracts';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { OrderRequest } from '../src/database/entities/index.js';
import { seedOrderData, validBody } from './order-request-fixtures.js';

describe('GET /order-requests and /order-requests/count (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let data: Awaited<ReturnType<typeof seedOrderData>>;

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
    data = await seedOrderData(dataSource, 'flexible');
  });

  const save = (lines: { wineId: string; quantity: number }[]) =>
    request(app.getHttpServer())
      .post('/order-requests')
      .set('Idempotency-Key', randomUUID())
      .send(validBody(data.customer.id, lines))
      .expect(201)
      .then((res) => res.body.id as string);

  it('returns an empty list and count 0 when nothing is saved', async () => {
    const list = await request(app.getHttpServer())
      .get('/order-requests')
      .expect(200);
    const count = await request(app.getHttpServer())
      .get('/order-requests/count')
      .expect(200);

    expect(list.body).toEqual([]);
    expect(count.body).toEqual({ count: 0 });
  });

  it('lists requests newest first with customer, rep and lines', async () => {
    const first = await save([{ wineId: data.few.id, quantity: 5 }]);
    const second = await save([
      { wineId: data.plenty.id, quantity: 2 },
      { wineId: data.none.id, quantity: 1 },
    ]);
    // Same timestamp as the second: the lowest id goes first.
    const older = await dataSource
      .getRepository(OrderRequest)
      .findOneByOrFail({ id: first });
    await dataSource
      .getRepository(OrderRequest)
      .update(
        { id: first },
        { createdAt: new Date(older.createdAt.getTime() - 1000) },
      );

    const res = await request(app.getHttpServer())
      .get('/order-requests')
      .expect(200);
    const count = await request(app.getHttpServer())
      .get('/order-requests/count')
      .expect(200);

    expect(savedRequestListSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.map((r: { id: string }) => r.id)).toEqual([second, first]);
    expect(count.body).toEqual({ count: 2 });
    expect(savedRequestCountSchema.safeParse(count.body).success).toBe(true);

    const wine = ({
      id,
      name,
      producer,
      vintage,
      region,
      sizeMl,
      sku,
    }: typeof data.few) => ({
      id,
      name,
      producer,
      vintage,
      region,
      sizeMl,
      sku,
    });
    expect(res.body[0]).toEqual({
      id: second,
      createdAt: expect.any(String),
      policy: 'flexible',
      contactName: 'Ana',
      phone: '+34 600 111 222',
      notes: 'Call back',
      salesRepName: 'Rep',
      customer: { name: 'Wine Bar', contactName: 'Ana' },
      lines: [
        {
          wine: wine(data.plenty),
          quantity: 2,
          availableAtSave: 10,
          shortBy: 0,
        },
        { wine: wine(data.none), quantity: 1, availableAtSave: 0, shortBy: 1 },
      ],
    });
    expect(res.body[1].lines).toEqual([
      { wine: wine(data.few), quantity: 5, availableAtSave: 3, shortBy: 2 },
    ]);
  });

  it('keeps availableAtSave when the stock changes afterwards', async () => {
    await save([{ wineId: data.few.id, quantity: 2 }]);
    await dataSource.query('UPDATE wine SET available = 100');

    const res = await request(app.getHttpServer())
      .get('/order-requests')
      .expect(200);
    expect(res.body[0].lines[0]).toMatchObject({
      availableAtSave: 3,
      shortBy: 0,
    });
  });

  it('breaks a createdAt tie with the lowest id', async () => {
    const ids = [await save([{ wineId: data.few.id, quantity: 1 }])];
    ids.push(await save([{ wineId: data.few.id, quantity: 1 }]));
    ids.push(await save([{ wineId: data.few.id, quantity: 1 }]));
    await dataSource.query('UPDATE order_request SET created_at = now()');

    const res = await request(app.getHttpServer())
      .get('/order-requests')
      .expect(200);
    expect(res.body.map((r: { id: string }) => r.id)).toEqual(ids.sort());
  });
});
