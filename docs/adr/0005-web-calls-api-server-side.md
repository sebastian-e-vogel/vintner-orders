# 0005. Web calls the API server-side

Status: accepted

## Context
`apps/web` is UI only and `apps/api` owns the data. The first wiring ticket (inventory policy) sets the rule that every later wiring ticket follows.

## Decision
- The web app calls the API server-side only: reads in Server Components, writes in Server Actions. The browser never calls the API, so there is no CORS and no public API URL.
- The API base URL is the server-only env var `API_URL` (no `NEXT_PUBLIC_` prefix). Next.js loads it from `apps/web/.env.local`, documented in `apps/web/.env.example`. When it is missing, the call fails with a clear error.
- Responses are parsed with the `packages/contracts` schemas before the UI uses them. Request bodies are typed from the contracts types. A malformed response is an error. Validation in the API stays the source of truth.
- Reads are always fresh: `fetch` uses `cache: 'no-store'` and pages that read the API are rendered per request (`await connection()`). No caching of API data.
- A failed read shows the route's `error.tsx`. A failed write shows the form's own error state.
- Per feature, `api.ts` holds the calls to the API and starts with `import 'server-only'`, so a Client Component cannot import it. `actions.ts` holds the thin `'use server'` actions: they validate their input with the contracts schemas (an action is a public POST endpoint) and delegate to `api.ts`.
- Only the server-only API code reads `API_URL` / `process.env`.
- When a second feature needs the same fetch, URL, error and parse logic, it moves to a server-only `src/lib/api.ts` (ADR 0004). We do not build a generic client before that.
- Reference: the bundled Next docs `01-app/02-guides/data-security.md` and `server-actions.md`.

## Consequences
- No CORS setup, and `API_URL` never reaches the client bundle.
- Pages that read the API are dynamic, so `next build` does not need a running API.
- Each read is a server-to-API hop with no cache. We add caching only after measuring a need.
- Alternatives rejected: browser `fetch` with CORS and a public API URL; Next route handlers as a proxy.
- Auth and an audit log of changes are out of scope (roadmap phase 3).
