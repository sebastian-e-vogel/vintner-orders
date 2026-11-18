---
name: typeorm
description: "TypeORM patterns for the NestJS API: module setup, entities, repositories, transactions, migrations and query logging. Use when creating or changing entities, repositories, database config or migrations."
---

# TypeORM patterns

Rules for `apps/api`. Only the API talks to the database.

## Core rules

| Topic | Rule |
|-------|------|
| Module | `TypeOrmModule.forRootAsync()` with `dataSourceFactory` |
| Naming | `SnakeNamingStrategy` from `typeorm-naming-strategies` |
| Schema | `synchronize: false` always. Every change is a versioned migration |
| Entities | Exported explicitly from `src/database/entities/index.ts` |
| Base class | Entities extend `TimestampedEntity` (created/updated columns), not TypeORM's `BaseEntity` |
| Foreign keys | Indexed with `@Index()` |
| Primary keys | Follow what the ticket decides; be consistent across entities |
| Money and quantities | `numeric` or integer columns, never `float` |
| Database | PostgreSQL, local through `docker-compose.yml` |

## Module setup

```typescript
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createTypeOrmOptions,
      dataSourceFactory: async (options) => new DataSource(options!).initialize(),
    }),
  ],
})
export class DatabaseModule {}
```

Connection settings come from environment variables validated at startup. No default passwords in code.

## Entities

```typescript
@Entity()
export class Customer extends TimestampedEntity {
  @Column()
  @Index({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];
}
```

- `TimestampedEntity` is abstract and has no `@Entity()`; only concrete entities do.
- Nullable columns need an explicit `type` and `T | null`.
- Add every new entity to `entities/index.ts`.
- More detail: [references/entity-patterns.md](references/entity-patterns.md).

## Repositories

Inject with `@InjectRepository(Entity)`. Create a custom repository class only when you need reusable query methods.

## Transactions

Class-based repositories extending `Repository<T>` do not join a transaction by themselves. Inside `dataSource.transaction(async (manager) => ...)` use `manager.withRepository(repo)` or `manager.getRepository(Entity)`. A query through the injected repository runs outside the transaction.

For concurrent updates (stock, counters) use a transaction plus a pessimistic lock (`setLock('pessimistic_write')`) or an atomic `UPDATE ... WHERE` and check the affected rows. Cover it with a concurrency test against real Postgres.

## Migrations

Never edit a migration that has been run. Add a new one.

```bash
pnpm --filter api migration:generate --name=AddOrderStatusIndex
pnpm --filter api migration:run
pnpm --filter api migration:revert
```

Review generated SQL before accepting it. A migration must work on a database that already has data.

## File structure

```
apps/api/src/database/
├── database.module.ts
├── database.config.ts
├── entities/
│   ├── index.ts
│   ├── timestamped.entity.ts
│   └── *.entity.ts
└── migrations/
    └── {timestamp}-{name}.ts
```

## References

- [references/configuration-patterns.md](references/configuration-patterns.md): options factory, env validation, CLI data source
- [references/entity-patterns.md](references/entity-patterns.md): base entity, relations, indexes, enums
- [references/observability-patterns.md](references/observability-patterns.md): query logging and slow queries
