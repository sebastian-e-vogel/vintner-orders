import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { customerListSchema, wineListSchema } from '@vintner/contracts';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { Customer, Wine } from '../src/database/entities/index.js';

describe('Wine and customer lists (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    await app.close();
  });

  // Each test starts from empty tables; CASCADE clears dependent rows too.
  beforeEach(async () => {
    await dataSource.query('TRUNCATE wine, customer CASCADE');
  });

  const wine = (overrides: Partial<Wine>) => ({
    name: 'Barolo',
    producer: 'Conterno',
    vintage: 2019,
    region: 'Barolo',
    sizeMl: 750,
    sku: 'SKU-1',
    available: 10,
    ...overrides,
  });

  describe('GET /wines', () => {
    it('returns an empty list when there are no wines', async () => {
      await request(app.getHttpServer()).get('/wines').expect(200).expect([]);
    });

    it('sorts by name, vintage (non-vintage last), size, then sku', async () => {
      await dataSource
        .getRepository(Wine)
        .save([
          wine({ sku: 'f', name: 'Chianti', vintage: null }),
          wine({ sku: 'e', name: 'Barolo', vintage: 2021 }),
          wine({ sku: 'd', name: 'Barolo', vintage: null }),
          wine({ sku: 'c', name: 'Barolo', vintage: 2019, sizeMl: 750 }),
          wine({ sku: 'b', name: 'Barolo', vintage: 2019, sizeMl: 1500 }),
          wine({ sku: 'a', name: 'Barolo', vintage: 2019, sizeMl: 1500 }),
        ]);

      const res = await request(app.getHttpServer()).get('/wines').expect(200);

      expect(res.body.map((w: { sku: string }) => w.sku)).toEqual([
        'c',
        'a',
        'b',
        'e',
        'd',
        'f',
      ]);
    });

    it('returns exactly the contract shape', async () => {
      await dataSource.getRepository(Wine).save(wine({ vintage: null }));

      const res = await request(app.getHttpServer()).get('/wines').expect(200);

      expect(res.body).toEqual([
        {
          id: expect.any(String),
          name: 'Barolo',
          producer: 'Conterno',
          vintage: null,
          region: 'Barolo',
          sizeMl: 750,
          sku: 'SKU-1',
          available: 10,
        },
      ]);
      expect(wineListSchema.safeParse(res.body).success).toBe(true);
    });
  });

  describe('GET /customers', () => {
    it('returns an empty list when there are no customers', async () => {
      await request(app.getHttpServer())
        .get('/customers')
        .expect(200)
        .expect([]);
    });

    it('returns the contract shape sorted by name', async () => {
      const customer = (name: string, email: string) => ({
        name,
        contactName: 'Ana',
        email,
        phone: '555-0100',
      });
      await dataSource
        .getRepository(Customer)
        .save([
          customer('Wine Bar', 'b@example.com'),
          customer('Cellar Door', 'a@example.com'),
        ]);

      const res = await request(app.getHttpServer())
        .get('/customers')
        .expect(200);

      expect(res.body).toEqual([
        {
          id: expect.any(String),
          name: 'Cellar Door',
          contactName: 'Ana',
          email: 'a@example.com',
          phone: '555-0100',
        },
        {
          id: expect.any(String),
          name: 'Wine Bar',
          contactName: 'Ana',
          email: 'b@example.com',
          phone: '555-0100',
        },
      ]);
      expect(customerListSchema.safeParse(res.body).success).toBe(true);
    });
  });
});
