# Vintner Orders

A phone-order desk for a fictional wine distributor. Sales reps take calls from restaurants, wine bars and hotels, find the right wine among near-identical labels, record quantities, and save an order request for later review.

It started as a small prototype. This repository rebuilds it from scratch with a different stack and a wider scope: a real API, a relational model with proper indexes, order lifecycle with stock commitments, background jobs and real-time updates. The history here is the history of that rebuild.

> Everything in this repository is fictional: wineries, customers, people and data.

## Stack

| Area | Choice |
| --- | --- |
| Web | Next.js, React, Tailwind CSS, Radix primitives |
| API | NestJS, TypeORM, PostgreSQL |
| Shared | Zod contracts in `packages/contracts` |
| Tests | Vitest (API and web), Testcontainers, Playwright (e2e) |

Why each choice: see [`docs/adr`](docs/adr).

## Layout

```
apps/web             Next.js, UI only
apps/api             NestJS, owns the database
packages/contracts   Zod schemas and types shared by both
docs/adr             Architecture decision records
```

## Local database

Needs Docker. From the repo root:

```
cp .env.example .env
pnpm db:up
```

`db:up` starts PostgreSQL 18 and waits until it is healthy. Connect with the values from `.env`, for example:

```
psql postgresql://vintner:vintner_local_password@localhost:5432/vintner_orders
```

`pnpm db:down` stops the container and keeps the data (named volume `postgres_data`). To wipe the data too, run `docker compose down -v`.

## Migrations

Schema changes are versioned migrations; `synchronize` is off. Migrations run **by hand**, never when the API starts:

```
pnpm --filter @vintner/api migration:run
pnpm --filter @vintner/api migration:revert
pnpm --filter @vintner/api migration:generate --name=AddThing
pnpm --filter @vintner/api migration:create --name=AddThing
```

The API reads the database settings from the root `.env` and exits at startup naming any variable that is missing or invalid. The migration scripts build the API first and run the CLI on `dist/`.

## Development seed

With the database up (`pnpm db:up`) and migrations applied (`pnpm --filter @vintner/api migration:run`):

```
pnpm db:seed
```

It empties every app table (not the migrations table) and inserts fixed demo data: 1 sales rep, 18 wines, 4 customers, 6 past orders, inventory policy `strict`, no order requests. Running it again gives the same data. It refuses to run when `NODE_ENV=production`.

## Integration tests

`pnpm test:integration` runs the API tests against a real PostgreSQL 18 started by Testcontainers. It needs Docker running; no `.env` or local Postgres. `pnpm test` stays Docker-free.

`pnpm test:e2e` boots the full `AppModule` against a PostgreSQL 18 container (migrations applied) started by Testcontainers. It also needs Docker running; no `.env` or local Postgres.

## API docs

With the API running (`pnpm dev:api`), Swagger UI is at http://localhost:3001/docs and the raw OpenAPI document at http://localhost:3001/docs/openapi.json. They are generated from the Zod schemas in `packages/contracts`; see [ADR 0005](docs/adr/0005-openapi-from-zod-contracts.md). A new endpoint documents itself with `@ApiOperation` and `@ApiResponse({ standardSchema })` on its handler; the docs e2e test fails when a response schema is missing. No auth yet, and the docs are served in every environment.

## Status

Scaffolding in progress. Setup instructions will land here with the first runnable commit. The plan is in [`ROADMAP.md`](ROADMAP.md).
