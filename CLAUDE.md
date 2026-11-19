# Vintner Orders: working rules

Phone-order desk for a fictional wine distributor. Monorepo: `apps/web` (Next.js, UI only), `apps/api` (NestJS, owns the database), `packages/contracts` (Zod schemas shared by both). Read `ROADMAP.md` for the plan and `docs/adr/` for decisions before changing architecture. Use pnpm.

## How we work

1. Read the task and the relevant code first. Do not write code at the start.
2. Reply with a short plan and your questions. Do not assume anything the task or the code does not say; ask when something is ambiguous.
3. Wait for my OK on the plan before implementing.
4. Implement only what the plan covers. If something extra needs changing, tell me instead of doing it silently.
5. Never push, open a PR, or install dependencies unless I ask. The `backend` and `frontend` agents commit and rebase their own ticket branch only when the orchestrator relays my approval, quoting my words.
6. Propose small conventional commits (`feat:`, `fix:`, `perf:`, `test:`, `docs:`, `chore:`). A `perf:` commit has before/after numbers in its body.

## Keep it simple

- Smallest change that solves the task. No abstractions, helpers, folders or config "for later".
- Follow the patterns already in the repo before inventing new ones.
- Keep components and modules small and scoped to one responsibility.
- Comments only for a "why" the code does not show, two lines at most.
- DRY only when the uses share the same responsibility. Do not merge unrelated logic because it looks similar.

## Architecture

- Only `apps/api` talks to the database, through TypeORM. Schema changes are versioned migrations. `synchronize` is never on.
- `apps/web` calls the API over HTTP and never imports database code.
- Validate all input on the server with the Zod schemas from `packages/contracts`. The client may reuse them for early feedback, but that never replaces server validation. Checks that depend on data or business rules (a record exists, stock is available) are separate server-side checks, not schema rules.

## React

- No `useEffect` by default. Only for syncing with something outside React (browser APIs, subscriptions, timers). Not for values you can compute during render, reacting to a user action, or fetching data the agreed data flow can handle.
- No `flushSync`. Handle focus with ref callbacks or an explicit "pending focus" state.
- Fewer `useState`: compute derived values. No `useMemo`, `useCallback` or `React.memo` without a measured reason.
- Server Components by default; `"use client"` only on the smallest component that needs state, events or browser APIs.
- Loading, empty and error states are part of every flow. Forms work with the keyboard, show clear errors, and block repeated submits while pending.

## Tests and checks

- Run lint, typecheck and tests before saying you are done. Report what failed; do not hide it. If you could not run something, say so.
- Unit tests for pure rules, integration tests against a real Postgres (Testcontainers), Playwright e2e for user flows. The strategy is in `docs/adr/0002-testing-strategy.md`.
- Test unhappy paths: invalid input, empty data, repeated submit, refresh in the middle of the flow, concurrent requests.

## Communication

- Short answers: what you did, what you did not do, what you need from me.
- If unsure, say "I'm not sure" and ask. Do not guess to keep moving.
