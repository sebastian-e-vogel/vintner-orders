# Configuration patterns

## Options factory

```typescript
// database.config.ts
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as entities from './entities';

export const createTypeOrmOptions = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.getOrThrow('DATABASE_HOST'),
  port: config.getOrThrow<number>('DATABASE_PORT'),
  username: config.getOrThrow('DATABASE_USER'),
  password: config.getOrThrow('DATABASE_PASSWORD'),
  database: config.getOrThrow('DATABASE_NAME'),
  entities: Object.values(entities),
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  migrationsRun: false,
});
```

- `getOrThrow` makes a missing variable fail at startup, not on the first query.
- Entities come from the barrel file, not from a glob, so bundlers see them.
- `migrationsRun` stays `false`: migrations run as an explicit step in deploy and in test setup.

## Environment variables

`.env.example` documents the names and local values. Real values are never committed.

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=
```

Set the local user, password and name to match `docker-compose.yml`.

## CLI data source

The TypeORM CLI needs its own `DataSource` export, built from the same options:

```typescript
// data-source.ts
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as entities from './entities';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: Object.values(entities),
  migrations: [__dirname + '/migrations/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
});
```

## Tests

Integration tests start Postgres with Testcontainers, run the real migrations, and build the `DataSource` from the container's connection data. Never use `synchronize: true` in tests: the migrations are part of what is being tested.
