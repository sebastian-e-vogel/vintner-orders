# Roadmap

Each phase leaves the repository in a demoable state. Performance work always records before/after numbers.

## 0. Foundations

- [x] Monorepo, TypeScript strict, lint, format, CI
- [ ] Docker Compose (Postgres), versioned migrations

## 1. Core ordering workflow

- [ ] Wine catalog, customers, inventory policy (strict / flexible) stored in the database
- [ ] Save an order request: validation, stock check, idempotent save
- [ ] Order screen: caller, wines, last time, recent wines, request panel, review and save
- [ ] Saved requests list
- [ ] OpenAPI docs (Swagger UI) generated from `packages/contracts`, so the Zod schemas stay the single source of truth
- [ ] Unit, integration and e2e tests for the above

## 2. Make it slow, then fast

- [ ] Deterministic seed generator at scale (~20k wines, ~5k customers, millions of order rows), written against the phase 1 schema
- [ ] Benchmark harness (k6 or autocannon), results kept in `docs/perf`
- [ ] Baseline measurements and `EXPLAIN ANALYZE` on the main queries
- [ ] Composite indexes, rewritten queries
- [ ] Keyset (cursor) pagination vs OFFSET at depth
- [ ] Wine search with autocomplete: `pg_trgm`, full-text, `unaccent`; accessible combobox

## 3. Auth and roles

- [ ] Sessions, roles (`rep`, `reviewer`, `admin`), guards
- [ ] Inventory policy restricted to admins, audit log of changes

## 4. Order lifecycle and concurrency

- [ ] States: requested, under review, confirmed, rejected
- [ ] Stock reservations backed by an append-only movement ledger
- [ ] Concurrency control compared: conditional update, row locks, optimistic versioning
- [ ] Concurrency test: hundreds of simultaneous orders on one wine

## 5. Asynchrony

- [ ] Add Redis to Docker Compose; transactional outbox and background queue (BullMQ)
- [ ] Scheduled jobs: expire reservations and idempotency keys, CSV inventory import, reorder suggestions

## 6. Real time and caching

- [ ] Live stock and reviewer notifications over WebSocket
- [ ] Cache-aside in Redis only where measurements justify it

## 7. Hardening

- [ ] Structured logs, metrics, load test report
- [ ] Deployment, diagrams, final write-up
