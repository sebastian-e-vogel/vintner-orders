import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { lastTimeResponseSchema, wineListSchema } from '@vintner/contracts';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import {
  Customer,
  HistoricalOrder,
  HistoricalOrderItem,
  SalesRep,
  Wine,
} from '../src/database/entities/index.js';
import { CURRENT_SALES_REP_ID } from '../src/sales-reps/current-sales-rep.js';

const CUSTOMER = '00000000-0000-4000-8000-000000000800';
const WINE = '00000000-0000-4000-8000-000000000001';

describe('Last time and recent wines (e2e)', () => {
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
    await dataSource.query('TRUNCATE wine, customer, sales_rep CASCADE');
    await dataSource.getRepository(SalesRep).save({
      id: CURRENT_SALES_REP_ID,
      name: 'Marta',
      email: 'm@example.com',
    });
    await dataSource.getRepository(Customer).save({
      id: CUSTOMER,
      name: 'Taverna',
      contactName: 'Ana',
      email: 'a@example.com',
      phone: '555-0100',
    });
    await dataSource.getRepository(Wine).save({
      id: WINE,
      name: 'Barolo',
      producer: 'Conterno',
      vintage: null,
      format: '750 ml',
      sku: 'SKU-1',
      available: 8,
    });
  });

  const server = () => request(app.getHttpServer());

  describe('GET /customers/:id/last-time', () => {
    it('returns null when the customer has no history', async () => {
      const res = await server()
        .get(`/customers/${CUSTOMER}/last-time`)
        .expect(200);
      expect(res.text).toBe('null');
    });

    it('returns 404 for an unknown customer', async () => {
      await server()
        .get('/customers/00000000-0000-4000-8000-000000000999/last-time')
        .expect(404);
    });

    it('returns 400 for a malformed customer id', async () => {
      await server().get('/customers/not-a-uuid/last-time').expect(400);
    });

    it('returns the last order in the contract shape', async () => {
      const orderId = '00000000-0000-4000-8000-000000000700';
      await dataSource.getRepository(HistoricalOrder).save({
        id: orderId,
        customerId: CUSTOMER,
        salesRepId: CURRENT_SALES_REP_ID,
        orderedAt: new Date('2026-01-02T10:00:00Z'),
      });
      await dataSource
        .getRepository(HistoricalOrderItem)
        .save({ orderId, wineId: WINE, quantity: 6 });

      const res = await server()
        .get(`/customers/${CUSTOMER}/last-time`)
        .expect(200);

      expect(res.body).toEqual({
        kind: 'order',
        at: '2026-01-02T10:00:00.000Z',
        salesRepName: 'Marta',
        items: [
          {
            quantity: 6,
            wine: {
              id: WINE,
              name: 'Barolo',
              producer: 'Conterno',
              vintage: null,
              format: '750 ml',
              sku: 'SKU-1',
              available: 8,
            },
          },
        ],
      });
      expect(lastTimeResponseSchema.safeParse(res.body).success).toBe(true);
    });
  });

  describe('GET /recent-wines', () => {
    it('returns an empty list without history', async () => {
      await server().get('/recent-wines').expect(200).expect([]);
    });

    it('returns the wines of the current rep in the contract shape', async () => {
      const orderId = '00000000-0000-4000-8000-000000000700';
      await dataSource.getRepository(HistoricalOrder).save({
        id: orderId,
        customerId: CUSTOMER,
        salesRepId: CURRENT_SALES_REP_ID,
        orderedAt: new Date('2026-01-02T10:00:00Z'),
      });
      await dataSource
        .getRepository(HistoricalOrderItem)
        .save({ orderId, wineId: WINE, quantity: 6 });

      const res = await server().get('/recent-wines').expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ id: WINE, available: 8 });
      expect(wineListSchema.safeParse(res.body).success).toBe(true);
    });

    it('returns 500 telling to run the seed when the current rep is missing', async () => {
      await dataSource.query('TRUNCATE sales_rep CASCADE');

      const res = await server().get('/recent-wines').expect(500);

      expect(res.body.message).toMatch(/pnpm db:seed/);
    });
  });
});
