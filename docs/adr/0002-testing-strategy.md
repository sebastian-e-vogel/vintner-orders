# 0002. Testing strategy

Status: superseded in part by 0003 (API test runner only)

## Context
Correctness here is about stock rules, idempotency and concurrency, which unit tests alone cannot prove.

## Decision
- API: Jest. Unit tests for pure rules; integration tests against a real PostgreSQL started by Testcontainers, so they run the same locally and in CI without manual setup.
- Web: Vitest and Testing Library for components with logic.
- End to end: Playwright across web and API for the critical flows: save in both inventory policies, persistence after refresh, double submit, keyboard-only use.
- Concurrency tests are written as soon as stock reservations exist.
- CI runs lint, typecheck and all test layers.

