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
- API call code is a small server-only module inside the feature folder (ADR 0004). We do not build a generic client until real duplication appears.

## Consequences
- No CORS setup, and `API_URL` never reaches the client bundle.
- Pages that read the API are dynamic, so `next build` does not need a running API.
- Each read is a server-to-API hop with no cache. We add caching only after measuring a need.
- Alternatives rejected: browser `fetch` with CORS and a public API URL; Next route handlers as a proxy.
- Auth and an audit log of changes are out of scope (roadmap phase 3).
