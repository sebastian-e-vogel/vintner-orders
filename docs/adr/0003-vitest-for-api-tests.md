# 0003. Vitest for API tests

Status: accepted

## Context
ADR 0002 chose Jest for the API tests. The Nest packages and this project are ESM only, and Jest needs extra configuration to run ESM. Vitest runs ESM natively. `apps/api` already uses Vitest (`vitest.config.ts`, `vitest.config.e2e.ts`, `vi.fn()` mocks).

## Decision
The API uses Vitest for unit, integration and e2e tests, replacing Jest. This supersedes only the API test runner in ADR 0002. Testcontainers, Playwright and Vitest for the web app still apply.

## Consequences
- One test runner across web and API.
- Mocks use `vi.fn()` and `vi.mock()`, not `jest.*`.
- Jest is not added to the API.
