# 0004. Web feature folders

Status: accepted

## Context
`apps/web` is growing past the app shell. Route colocation (`app/<route>/_components`) does not fit well: the order screen is the root route, so its code would sit at the top of `app/` next to the shell.

## Decision
- `src/features/<feature>/` holds a feature's components, pure rules and their tests.
- `src/components/` holds only shared code used by two or more features or by the app shell (Header, NavLink, PageHeading).
- Shared non-UI code (types, pure helpers) used by 2+ features lives in `src/lib/`.
- Generic UI primitives with no business meaning (`Button`, `Banner`, `Dialog`) live in `src/components/ui/` from the start. The rule below applies to business components.
- Code starts inside its feature and moves to `components/` only when a second feature uses it. We do not share ahead of time.
- Features do not import from each other.
- Pages in `src/app/` compose features and hold no logic.
- Unit and component tests sit next to the file they test (`X.tsx` and `X.test.tsx`).
- Playwright e2e tests go in `apps/web/e2e/` when they arrive.
- Temporary fixtures stay in `src/fixtures/` until the API is wired.

## Consequences
- A feature can be read, changed or deleted in one folder.
- Moving code to `components/` is a deliberate step taken when a second use appears.
- Cross-feature needs must go through `components/` or a page, not a direct import.
