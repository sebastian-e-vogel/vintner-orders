import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '../src/database/database.config.js';
import { InventoryPolicyService } from '../src/settings/inventory-policy.service.js';

describe('inventory policy service', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let service: InventoryPolicyService;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18').start();
    dataSource = new DataSource(
      createDataSourceOptions({
        POSTGRES_HOST: container.getHost(),
        POSTGRES_PORT: container.getPort(),
        POSTGRES_USER: container.getUsername(),
        POSTGRES_PASSWORD: container.getPassword(),
        POSTGRES_DB: container.getDatabase(),
      }),
    );
    await dataSource.initialize();
    await dataSource.runMigrations();
    service = new InventoryPolicyService(dataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    await container?.stop();
  });

  const clear = () => dataSource.query(`DELETE FROM "settings"`);
  const seed = (policy = 'strict') =>
    dataSource.query(
      `INSERT INTO "settings" ("inventory_policy") VALUES ($1)`,
      [policy],
    );
  const rowCount = async () =>
    Number(
      (await dataSource.query(`SELECT count(*) FROM "settings"`))[0].count,
    );

  beforeEach(async () => {
    await clear();
  });

  it('reads the stored policy and timestamp', async () => {
    await seed('flexible');
    const result = await service.get();
    expect(result.policy).toBe('flexible');
    expect(new Date(result.updatedAt).toString()).not.toBe('Invalid Date');
  });

  it('reads inside a caller transaction', async () => {
    await seed();
    const result = await dataSource.transaction((manager) =>
      service.get(manager),
    );
    expect(result.policy).toBe('strict');
  });

  it('updates the policy and moves updatedAt forward', async () => {
    await seed();
    const before = await service.get();
    const updated = await service.set('flexible');
    expect(updated.policy).toBe('flexible');
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
      new Date(before.updatedAt).getTime(),
    );
    expect(await service.get()).toEqual(updated);
  });

  it('fails with a server error when the row is missing, on read and on update', async () => {
    await expect(service.get()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    await expect(service.set('strict')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(await rowCount()).toBe(0);
  });

  it('leaves exactly one row after concurrent updates', async () => {
    await seed();
    const policies = Array.from({ length: 20 }, (_, i) =>
      i % 2 ? 'strict' : 'flexible',
    ) as ('strict' | 'flexible')[];
    await Promise.all(policies.map((policy) => service.set(policy)));
    expect(await rowCount()).toBe(1);
    expect(['strict', 'flexible']).toContain((await service.get()).policy);
  });

  it('rejects a second row at the database level', async () => {
    await seed();
    await expect(seed()).rejects.toThrow(/duplicate key/);
    await expect(
      dataSource.query(
        `INSERT INTO "settings" ("id", "inventory_policy") VALUES (false, 'strict')`,
      ),
    ).rejects.toThrow(/CHK_settings_single_row/);
    expect(await rowCount()).toBe(1);
  });

  it('rejects an unknown policy value in the database', async () => {
    await expect(seed('lenient')).rejects.toThrow(/invalid input value/);
  });
});
