import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  saveOrderRequestRejectedSchema,
  saveOrderRequestResponseSchema,
} from '@vintner/contracts';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import {
  OrderRequest,
  OrderRequestItem,
  Wine,
} from '../src/database/entities/index.js';
import { CURRENT_SALES_REP_ID } from '../src/sales-reps/current-sales-rep.js';
import { seedOrderData, validBody } from './order-request-fixtures.js';

describe('POST /order-requests (e2e)', () => {
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
    data = await seedOrderData(dataSource);
  });

  // Pass `null` to send no Idempotency-Key header.
  const post = (body: unknown, key: string | null = randomUUID()) => {
    const req = request(app.getHttpServer()).post('/order-requests');
    return (key === null ? req : req.set('Idempotency-Key', key)).send(
      body as object,
    );
  };
  const requestCount = () => dataSource.getRepository(OrderRequest).count();
  const body = (lines: { wineId: string; quantity: number }[]) =>
    validBody(data.customer.id, lines);

  it('saves a request with 201 and does not touch stock', async () => {
    const res = await post(
      body([{ wineId: data.plenty.id, quantity: 4 }]),
    ).expect(201);

    expect(res.body).toEqual({
      id: expect.any(String),
      createdAt: expect.any(String),
      policy: 'strict',
      duplicate: false,
      lines: [
        { wineId: data.plenty.id, quantity: 4, available: 10, shortBy: 0 },
      ],
    });
    expect(saveOrderRequestResponseSchema.safeParse(res.body).success).toBe(
      true,
    );
    const stored = await dataSource
      .getRepository(OrderRequest)
      .findOneByOrFail({ id: res.body.id });
    expect(stored.salesRepId).toBe(CURRENT_SALES_REP_ID);
    expect(stored.contactName).toBe('Ana');
    expect(stored.notes).toBe('Call back');
    expect(
      (
        await dataSource
          .getRepository(Wine)
          .findOneByOrFail({ id: data.plenty.id })
      ).available,
    ).toBe(10);
  });

  it('saves duplicate wines in the body as one combined line', async () => {
    const res = await post(
      body([
        { wineId: data.plenty.id, quantity: 2 },
        { wineId: data.plenty.id, quantity: 3 },
      ]),
    ).expect(201);

    expect(res.body.lines).toEqual([
      { wineId: data.plenty.id, quantity: 5, available: 10, shortBy: 0 },
    ]);
    expect(await dataSource.getRepository(OrderRequestItem).count()).toBe(1);
  });

  it('returns 200 with duplicate: true for the same key and body', async () => {
    const key = randomUUID();
    const lines = [{ wineId: data.plenty.id, quantity: 4 }];
    const first = await post(body(lines), key).expect(201);
    const second = await post(body(lines), key).expect(200);

    expect(second.body).toEqual({ ...first.body, duplicate: true });
    expect(await requestCount()).toBe(1);
  });

  it('treats the same content in another line order as the same body', async () => {
    const key = randomUUID();
    const a = { wineId: data.plenty.id, quantity: 1 };
    const b = { wineId: data.few.id, quantity: 2 };
    await post(body([a, b]), key).expect(201);
    await post(body([b, a]), key).expect(200);
  });

  it('returns 422 idempotency_key_reused when the key comes with another body', async () => {
    const key = randomUUID();
    await post(body([{ wineId: data.plenty.id, quantity: 1 }]), key).expect(
      201,
    );
    const res = await post(
      body([{ wineId: data.plenty.id, quantity: 2 }]),
      key,
    ).expect(422);

    expect(res.body).toMatchObject({ reason: 'idempotency_key_reused' });
    expect(await requestCount()).toBe(1);
  });

  it.each([
    ['missing', null],
    ['not a UUID', 'abc'],
  ])('returns 400 when the Idempotency-Key is %s', async (_name, key) => {
    const res = await post(
      body([{ wineId: data.plenty.id, quantity: 1 }]),
      key,
    ).expect(400);

    expect(res.body.fieldErrors).toHaveProperty('Idempotency-Key');
    expect(await requestCount()).toBe(0);
  });

  it('returns 400 with field paths and first messages for an invalid body', async () => {
    const res = await post({
      customerId: 'nope',
      contactName: '  ',
      phone: '12',
      lines: [{ wineId: data.plenty.id, quantity: 0 }],
    }).expect(400);

    expect(res.body.reason).toBe('invalid_request');
    expect(Object.keys(res.body.fieldErrors).sort()).toEqual([
      'contactName',
      'customerId',
      'lines.0.quantity',
      'phone',
    ]);
    expect(res.body.fieldErrors.phone).toBe('Phone needs at least 7 digits.');
    expect(await requestCount()).toBe(0);
  });

  it('returns 400 for an empty body', async () => {
    const res = await request(app.getHttpServer())
      .post('/order-requests')
      .set('Idempotency-Key', randomUUID())
      .expect(400);
    expect(res.body.reason).toBe('invalid_request');
  });

  it('returns 500 asking for the seed when the current sales rep is missing', async () => {
    await dataSource.query('TRUNCATE order_request, sales_rep CASCADE');
    const res = await post(
      body([{ wineId: data.plenty.id, quantity: 1 }]),
    ).expect(500);
    expect(res.body.message).toMatch(/Run the seed/);
    expect(await requestCount()).toBe(0);
  });

  it('returns 422 unknown_customer', async () => {
    const res = await post({
      ...body([{ wineId: data.plenty.id, quantity: 1 }]),
      customerId: randomUUID(),
    }).expect(422);
    expect(res.body).toMatchObject({ reason: 'unknown_customer' });
    expect(await requestCount()).toBe(0);
  });

  it('returns 422 unknown_wines with the ids', async () => {
    const missing = randomUUID();
    const res = await post(
      body([
        { wineId: data.plenty.id, quantity: 1 },
        { wineId: missing, quantity: 1 },
      ]),
    ).expect(422);
    expect(res.body).toMatchObject({
      reason: 'unknown_wines',
      wineIds: [missing],
    });
    expect(await requestCount()).toBe(0);
  });

  it('rejects a short line under the strict policy with 422 over_stock', async () => {
    const res = await post(
      body([
        { wineId: data.plenty.id, quantity: 1 },
        { wineId: data.few.id, quantity: 5 },
      ]),
    ).expect(422);

    expect(res.body).toMatchObject({ reason: 'over_stock', policy: 'strict' });
    expect(saveOrderRequestRejectedSchema.safeParse(res.body).success).toBe(
      true,
    );
    expect(res.body.lines).toEqual(
      expect.arrayContaining([
        { wineId: data.plenty.id, quantity: 1, available: 10, shortBy: 0 },
        { wineId: data.few.id, quantity: 5, available: 3, shortBy: 2 },
      ]),
    );
    expect(await requestCount()).toBe(0);
  });

  it('saves a short line under the flexible policy and returns its shortBy', async () => {
    data = await seedOrderData(dataSource, 'flexible');
    const res = await post(
      body([
        { wineId: data.few.id, quantity: 5 },
        { wineId: data.none.id, quantity: 1 },
      ]),
    ).expect(201);

    expect(res.body.policy).toBe('flexible');
    expect(res.body.lines).toEqual(
      expect.arrayContaining([
        { wineId: data.few.id, quantity: 5, available: 3, shortBy: 2 },
        { wineId: data.none.id, quantity: 1, available: 0, shortBy: 1 },
      ]),
    );
    const wines = await dataSource.getRepository(Wine).find();
    expect(wines.map((w) => w.available).sort((a, b) => a - b)).toEqual([
      0, 3, 10,
    ]);
  });

  it('creates exactly one row for many parallel requests with the same key', async () => {
    const key = randomUUID();
    const payload = body([{ wineId: data.plenty.id, quantity: 4 }]);
    const responses = await Promise.all(
      Array.from({ length: 20 }, () => post(payload, key)),
    );

    expect(responses.map((r) => r.status).sort((a, b) => a - b)).toEqual([
      ...Array<number>(19).fill(200),
      201,
    ]);
    expect(new Set(responses.map((r) => r.body.id)).size).toBe(1);
    expect(await requestCount()).toBe(1);
    expect(await dataSource.getRepository(OrderRequestItem).count()).toBe(1);
  });

  it('answers 200 or 422, never 500, for parallel requests with the same key and different bodies', async () => {
    const key = randomUUID();
    const responses = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        post(body([{ wineId: data.plenty.id, quantity: (i % 2) + 1 }]), key),
      ),
    );

    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.every((s) => [200, 201, 422].includes(s))).toBe(true);
    expect(await requestCount()).toBe(1);
  });
});
