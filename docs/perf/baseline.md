# Phase 2 performance baseline

State of the API at scale before any optimization. This report measures and proposes; it changes nothing. Raw data:

- k6 result: [`2026-11-25-baseline.md`](2026-11-25-baseline.md)
- Plans and timings: [`2026-11-25-baseline-explain.md`](2026-11-25-baseline-explain.md)
- The exact SQL and parameters, to re-run after each change: [`queries.sql`](queries.sql)

## Setup

- Code: `develop` at 520001d, no app or schema changes.
- Data (`pnpm db:seed:scale`): 20,000 wines, 5,000 customers, 50 sales reps, 500,000 historical orders with 2,001,552 items, 20,000 saved order requests. The data is skewed: one heavy customer has 35,873 orders, a light one has 6, and the current rep owns about a quarter of all orders.
- PostgreSQL 18.7 in Docker, `shared_buffers` 128MB, `work_mem` 4MB. `historical_order_item` is 290 MB and `historical_order` 109 MB, so neither fits in `shared_buffers`.
- The EXPLAINs were taken on the clean seed, before the benchmark. The benchmark then added 2,000 requests (20,000 to 22,000); the database was reseeded afterwards.
- Machine: Apple M1, 8 logical CPUs, 8 GB RAM. Postgres, the API, Docker and k6 all share it, so absolute numbers are noisy. This is one run, not a median of several. Compare ratios and orders of magnitude, not single milliseconds.

## How to read the two kinds of numbers

k6 measures the endpoint end to end: network, Nest, TypeORM, the query, hydration into entities, JSON serialization. EXPLAIN measures only the time Postgres spends on the SQL. The gap between them is a finding by itself.

`GET /order-requests` shows it best. A single request takes about 0.94 s (curl, 21.7 MB). Postgres needs about 0.27 s of that (Q7 90 ms + Q8 180 ms); the other ~0.65 s is TypeORM building about 20,000 entities with 70,000 items and serializing 21.7 MB. That work runs on the single Node thread, so ten virtual users queue behind each other: 10 VUs at 1.4 req/s means about 7 s per request, which is the p50 of 6.9 s.

## Summary per endpoint

10 virtual users, 30 s steady state, no pauses (see the k6 file for the settings). Error rate 0% everywhere.

| Endpoint | req/s | p50 ms | p95 ms | p99 ms | Response size | DB time (EXPLAIN) |
| --- | --- | --- | --- | --- | --- | --- |
| GET /wines | 14.7 | 664.0 | 846.0 | 988.6 | 3.7 MB | 29 ms (Q1) |
| GET /customers | 70.3 | 137.7 | 202.4 | 240.4 | 839 KB | 10 ms (Q2) |
| GET /customers/:id/last-time (heavy) | 45.4 | 207.1 | 333.4 | 444.9 | 510 B | 108 ms (Q4a) |
| GET /customers/:id/last-time (light) | 2488.3 | 3.4 | 6.7 | 12.3 | 927 B | 0.13 ms (Q4b) |
| GET /recent-wines | 8.9 | 945.9 | 2250.9 | 2493.5 | 1.9 KB | 328 ms (Q6) |
| GET /order-requests | 1.4 | 6852.7 | 8332.3 | 10982.0 | 21.7 MB | 90 + 180 ms (Q7, Q8) |
| GET /order-requests/count | 3020.0 | 2.9 | 5.1 | 7.6 | tiny | 6.8 ms (Q9) |
| POST /order-requests | 944.7 | 9.5 | 15.0 | 29.4 | small | 0.06 + 0.1 ms reads (Q10) |

Response sizes were measured with curl on the clean seed. The light customer, `/count` and the POST are healthy. The rest are the problems below.

## Slowest queries

Execution times are from the third run of each query. The `Qn` names match `queries.sql`.

| Query | Endpoint | Execution | Plan in one line |
| --- | --- | --- | --- |
| Q6 | GET /recent-wines | 328 ms | Parallel seq scan of all 2M `historical_order_item` rows, 12,022 buffers read from disk |
| Q8 | GET /order-requests, items | 180 ms (+52 ms planning) | Seq scan + hash join with all wines + sort spilling 10 MB to disk |
| Q4a | last-time, heavy customer | 108 ms | Reads all 35,873 orders of the customer to return one row |
| Q7 | GET /order-requests, list | 90 ms | Sort of 20,000 rows spilling 6.7 MB to disk |
| Q1 | GET /wines | 29 ms | Seq scan and in-memory sort of 20,000 rows |
| Q2 | GET /customers | 10 ms | Same pattern, 5,000 rows |
| Q9 | count | 6.8 ms | Index-only scan of 20,000 entries |
| Q3, Q5, Q10a, Q10b | | under 0.2 ms | Primary key or unique index lookups |

### Q6: GET /recent-wines (328 ms, worst)

- The query joins the rep's orders (about 125,000, a quarter of all) with `historical_order_item`, aggregates `max(ordered_at)` per wine over all of it, then keeps the top 10.
- Plan: `Parallel Seq Scan on historical_order_item` (2M rows, 667,184 per worker) hash-joined with the rep's orders, `GroupAggregate` over the wines, then a top-N sort.
- Estimate against actual: the planner expected 200 groups and found 18,762 wines. The estimate was wrong by almost 100x (the hash grew from 1024 to 32768 buckets), and the aggregate result is as large as the wine catalog, not 10 rows.
- `Buffers: shared hit=15374 read=12022` on the third run: the item table does not fit in `shared_buffers`, so every call keeps reading it from the OS cache or disk.
- Cause: the query computes the latest order date of every wine the rep ever sold, to keep 10 of them. The work grows with the rep's whole history. The existing index `(sales_rep_id, ordered_at)` on `historical_order` is not used.
- k6: p95 2.25 s, p99 2.49 s. The tail is wide, probably because the parallel workers compete with the other 9 VUs for the same cores (not verified).

### Q8 and Q7: GET /order-requests (the worst endpoint, 21.7 MB)

- The endpoint returns every saved request, with no limit: 21,673,886 bytes at 20,000 requests. It grows with every POST.
- Q7: seq scan of `order_request`, hash joins with all 5,000 customers and 50 reps, then `Sort Method: external merge Disk: 6720kB` because the sort is larger than `work_mem` (4MB). There is no index on `created_at`, so the sort is needed.
- Q8: the app sends `IN ($1 ... $20000)`, one parameter per request. Planning alone takes 52 ms. The planner correctly chooses a seq scan over `order_request_item` (it needs 69,884 of 69,884 rows), hash joins all 20,000 wines, and sorts 69,884 rows by wine name, spilling 10 MB to disk. The index `(request_id, wine_id)` is not used because the list covers every request.
- Postgres is not the main cost here (about 0.27 s of 0.94 s). Hydrating the entities and serializing the JSON is. One response also holds 21.7 MB in memory per concurrent call.
- Cause: unbounded list, no pagination. Everything else follows from it.

### Q4a: last-time for a customer with many orders (108 ms)

- The query takes the customer's orders and requests as a `UNION ALL`, then `ORDER BY at DESC ... LIMIT 1`. The sort and the limit apply after the union, so Postgres first reads all 35,873 orders (`Bitmap Heap Scan`, 41,270 buffers), and only then keeps the newest.
- The sales rep name is a correlated subquery in the select list: `SubPlan 1` runs 35,873 times (`loops=35873`, a seq scan of 50 rows each) for rows that are all thrown away except one.
- Q4b (light customer, 6 orders) takes 0.13 ms with the same SQL, so the cost scales with the customer's order count only.
- A run on an earlier, unclean database also showed JIT compilation costing about 11 ms of 80 ms, because the estimated cost passed `jit_above_cost`. Not seen in the baseline run, but it is a risk for this query shape.
- k6: p50 207 ms, p95 333 ms. The existing index `(customer_id, ordered_at)` could answer "newest order of this customer" with one index probe, but the query shape prevents it.

### Q1 and Q2: GET /wines and GET /customers

- Postgres is fine: 29 ms and 10 ms, seq scan plus an in-memory quicksort (2.8 MB and 0.7 MB).
- The payload is the problem: 3.7 MB for 20,000 wines (about 186 bytes each) and 839 KB for 5,000 customers, on every call. k6 shows p50 664 ms for `/wines` against 29 ms in the database: the rest is entity hydration, JSON serialization and the transfer.
- Cause: the whole catalog is sent to the client so the form can filter it there. This does not scale with the catalog, and it is the reason the UI needs a search.

### Q9, Q3, Q5, Q10

Fine at this size. `/count` (6.8 ms) is an index-only scan of 20,000 entries and will grow linearly with the table. The lookups by primary key or unique key take under 0.2 ms.

## Ranked optimizations

Each item is a proposal; nothing is implemented here. Expected effects are estimates to confirm with the same bench and `queries.sql`; each change should land as its own `perf:` commit with before/after numbers.

1. **Rewrite `recent-wines` (Q6).** Walk the rep's orders newest first through `(sales_rep_id, ordered_at)`, join their items, and stop once 10 distinct wines are found, instead of aggregating the rep's whole history. Same for the `order_request` branch. Expected: from 328 ms to a few ms, no reads of the 290 MB item table, and a much shorter p95 tail (2.25 s now). Largest gain per line of code. No schema change needed, since the index exists.
2. **Paginate saved requests with a keyset (cursor) on `(created_at DESC, id)`.** Needs a new index `order_request (created_at DESC, id)` (a migration), a `limit` and `cursor` in the contract, and a "load more" in the UI (backend and frontend tickets). Q7 then reads about 50 rows without a sort. Q8 then uses the `(request_id, wine_id)` index with about 50 ids instead of 20,000 parameters, and the 52 ms planning time goes away. Expected: response from 21.7 MB to about 50 KB; endpoint from 0.94 s single and 6.9 s p50 under load to tens of milliseconds. Biggest user-visible change, and it stays flat as the table grows. The roadmap item "Keyset pagination vs OFFSET at depth" covers it.
3. **Rewrite the last-time query (Q4a).** Put `ORDER BY ... DESC LIMIT 1` inside each `UNION ALL` branch so each uses its `(customer_id, ordered_at)` / `(customer_id, created_at)` index, then compare the two rows. Look up the rep name after the limit, not per row. Expected: 108 ms to under 1 ms for the heavy customer, the same as the light one today; no JIT risk. Also no schema change.
4. **Search instead of full lists for wines and customers (Q1, Q2).** A search endpoint with a limit (`pg_trgm` or full-text, `unaccent`) and an accessible combobox in the form, replacing `GET /wines` and `GET /customers`. Expected: 3.7 MB and 839 KB per page load down to a few KB per keystroke. The database gain is small (29 ms and 10 ms); the gain is in payload, hydration and the browser. It needs a new index (trigram GIN) and a UI change, so it ranks below the three above. It is the roadmap item "Wine search with autocomplete".
5. **Smaller items, only if they still show up after 1 to 4.**
   - Raise `work_mem` or avoid the sorts: item 2 removes both spills (6.7 MB and 10 MB), so this needs no separate change.
   - Skip entity hydration on read-only list endpoints (query builder or raw rows). Considered only after pagination, since it would shave the remaining non-database time of `/wines` and `/customers`.
   - `/order-requests/count` grows linearly (6.8 ms at 20,000). Fine now; a cached or estimated count is an option if the table grows by orders of magnitude.

## Not measured

- One k6 run on a shared laptop, no repetitions; see the setup note above.
- Reads and writes are not mixed in one scenario, so contention between them is not covered.
- The web app (rendering, transfer to the browser) is not part of this baseline.
