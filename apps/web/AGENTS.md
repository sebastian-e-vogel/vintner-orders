<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Browser e2e (Playwright)

Specs live in `e2e/` and run with Chromium against the real API and a real database. They use their own ports and their own database, so a running dev setup (web on :3000, API on :3001, database `vintner_orders`) is never touched.

One-time setup:

1. `pnpm db:up`, with the root `.env` in place (the API reads it from the repo root; a git worktree needs its own copy).
2. Create the e2e database once: `docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE vintner_orders_e2e"'`.
3. Install the browser: `pnpm --filter @vintner/web exec playwright install chromium`.

Then `pnpm test:e2e` (from the root it also runs the API's HTTP tests). Each run builds both apps, migrates and re-seeds `vintner_orders_e2e` (the seed is deterministic and empties the app tables), and starts the API on :3101 and the web app on :3100. Ports 3100 and 3101 must be free: the run fails rather than reusing a running server.

Specs share one database and one global policy, so they run one at a time. Specs that save requests or change the policy restore it (strict) when they finish, even on failure.
