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

`pnpm dev` starts the API and web together. The web app needs `API_URL` in `apps/web/.env.local` (copy `apps/web/.env.example`).

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

## Perf database

`pnpm db:seed:scale` fills a separate database with realistic volumes, so the dev database and its small seed stay untouched. With the database up (`pnpm db:up`):

```
pnpm db:seed:scale
```

It connects to Postgres with the root `.env` credentials, creates the database if missing (default `vintner_perf`, change it with `POSTGRES_PERF_DB`), runs the migrations, empties every app table and loads about 20k wines, 5k customers, 50 sales reps (the current rep included, with about 25% of the activity), 500k historical orders with about 2M items, and 20k saved order requests. Popular wines and heavy-ordering customers are skewed on purpose. The data comes from a seeded generator, so every run produces the same rows (ids included). At the end it prints the row count per table and the duration. It refuses to run when `NODE_ENV=production`, or when the perf database name equals `POSTGRES_DB`.

To run the API against it:

```
POSTGRES_DB=vintner_perf pnpm dev:api
```

## Run a benchmark

[k6](https://k6.io) is a load-testing tool: it sends many HTTP requests at the API and measures how long each takes. A virtual user (VU) is one simulated client that sends requests in a loop. The results show p50, p95 and p99 latency (the time within which 50%, 95% and 99% of the requests finished, so p99 is the slow tail), requests per second, and the error rate. A threshold is a pass/fail rule: the run fails when the error rate is 1% or more.

`pnpm bench [label]` runs k6 from the official Docker image (`grafana/k6:2.4.0`, nothing to install; the first run pulls it) against the perf database and writes `docs/perf/<YYYY-MM-DD>-<label>.md`. Docker must be running. Steps:

1. `pnpm db:up` and `pnpm db:seed:scale` (see "Perf database"; the seed takes a few minutes and resets the perf database).
2. Build and start the API against it. Use the built API, not watch mode, so the numbers are not skewed by the dev tooling:

   ```
   pnpm build
   POSTGRES_DB=vintner_perf pnpm start:api
   ```

3. In another terminal: `pnpm bench baseline`. The label is optional (default `run`); lowercase letters, digits and hyphens, and it cannot end in `explain`.

The file records p50, p95 and p99, requests per second and error rate per endpoint, plus the commit, date, CPU and RAM, and the k6 settings. The run takes about 7 minutes and exits non-zero when any endpoint has an error rate of 1% or more, so it can be scripted. Set `BENCH_BASE_URL` (default `http://localhost:3001`) when the API listens elsewhere.

Fixed load settings, the same on every run so results compare:

- Read endpoints (`/wines`, `/customers`, `/customers/:id/last-time` for a heavy and a light customer, `/recent-wines`, `/order-requests`, `/order-requests/count`) run one after another, each with 10 VUs, a 10 s ramp-up that is not counted, then 30 s at full load, with no pause between requests.
- `POST /order-requests`: 10 VUs share 2000 requests, each with a fresh `Idempotency-Key`, 1 to 3 wines and 1 to 5 bottles per line. The scenario aborts unless the inventory policy is `strict`, and it only uses wines with at least 50 in stock.
- The heavy and light customers are fixed ids from the seed, in `perf/k6/data.js`.

Things to know when comparing runs:

- Every run saves 2000 new requests, so the next run starts with more data. Re-seed (`pnpm db:seed:scale`) before each run you want to compare. Each result file records the saved-request count before and after.
- The `postgres` service sets `shm_size: 256mb`. With Docker's default 64 MB, parallel queries on the perf data fail with "No space left on device"; after pulling this change, recreate it with `pnpm db:up`.
- Compare only results from the same machine. Docker Desktop on macOS runs k6 in a VM, so its CPU and memory limits are not in the file.
- The container reaches the API on the host through `host.docker.internal`. `--add-host=host.docker.internal:host-gateway` is passed so this also works on Linux. The API must listen on all interfaces (the default).
- Commit a result file only when it backs a `perf:` commit.

## Integration tests

`pnpm test:integration` runs the API tests against a real PostgreSQL 18 started by Testcontainers. It needs Docker running; no `.env` or local Postgres. `pnpm test` stays Docker-free.

`pnpm test:e2e` boots the full `AppModule` against a PostgreSQL 18 container (migrations applied) started by Testcontainers. It also needs Docker running; no `.env` or local Postgres.

## API docs

With the API running (`pnpm dev:api`), Swagger UI is at http://localhost:3001/docs and the raw OpenAPI document at http://localhost:3001/docs/openapi.json. They are generated from the Zod schemas in `packages/contracts`; see [ADR 0005](docs/adr/0005-openapi-from-zod-contracts.md). A new endpoint documents itself with `@ApiOperation` and `@ApiResponse({ standardSchema })` on its handler; the docs e2e test fails when a response schema is missing. No auth yet, and the docs are served in every environment.

## Status

Scaffolding in progress. Setup instructions will land here with the first runnable commit. The plan is in [`ROADMAP.md`](ROADMAP.md).
