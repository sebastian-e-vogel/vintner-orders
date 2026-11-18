# 0001. Monorepo with a Next.js web app and a NestJS API

Status: accepted

## Context
pnpm monorepo. Background jobs, queues and WebSockets need long-lived processes and a clear home for domain logic. Next.js route handlers and server actions are a poor fit for them.

## Decision
One pnpm workspace:
- `apps/web`: Next.js, UI only.
- `apps/api`: NestJS. Owns the database, authentication, queues, scheduled jobs and the WebSocket gateway.
- `packages/contracts`: Zod schemas and inferred types used by both sides.
- `docker-compose.yml`: local infrastructure.


## Consequences
- One more process to run and deploy, in exchange for a clean boundary and the NestJS module, guard and gateway model.
- Request and response shapes live in one place and cannot drift.
