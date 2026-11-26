# Recent wines query, 2026-11-26

`GET /recent-wines` (Q6 in `queries.sql`) no longer reads the rep's whole history. No new index or migration. Database `vintner_perf` (scale seed).

## Idea and trade-off

"Recent" now means the newest 200 items of each source (orders by `ordered_at`, requests by `created_at`). Each branch walks the existing `(sales_rep_id, date)` index backward and stops after 200 items. The result is the newest date per wine across both branches, ties by `wine.id`, at most 10.

Accepted behavior change (product decision on #92): a rep whose last 200 items of a source hold fewer than 10 distinct wines sees fewer than 10, and a tie exactly at item 200 may be cut arbitrarily. A wine in an order and a request still takes the newest of its two dates.

## Q6 (`EXPLAIN (ANALYZE, BUFFERS)`, third run)

| | Execution | Buffers | Plan |
| --- | --- | --- | --- |
| Before | 236.6 ms | hit=15,219 read=12,180 | Parallel Seq Scan of `historical_order_item` (2M rows) |
| Recursive date walk (not kept) | 0.74 ms | hit=234 | Index scans, exact same result as before |
| Window of 200 (this change) | 5.1 ms | hit=832 | Index Scan Backward on both rep indexes under a Limit, items by index, no seq scan of the item tables, no JIT |

Window runs 1 to 3: 219, 16, 5 ms (the first is cold). Most of the 5 ms is a hash join with a seq scan of `wine` (20,000 rows) for the 254 distinct wines.

## k6 (`pnpm bench`, 10 VUs, 30 s)

| | p50 | p95 | p99 | req/s |
| --- | --- | --- | --- | --- |
| Baseline report (before) | 945.9 ms | 2250.9 ms | 2493.5 ms | 8.9 |
| Recursive date walk | 5.6 ms | 13.1 ms | 21.7 ms | 1456.8 |
| Window of 200 | 7.0 ms | 13.6 ms | 21.6 ms | 1236.5 |

A same-session "before" run gave p50 4.5 s and p95 10.4 s, inflated by machine load, so the baseline report is used instead. The database was reseeded after benching.

## SQL

```sql
  WITH activity AS (
    (SELECT i.wine_id, o.ordered_at AS at
     FROM historical_order o JOIN historical_order_item i ON i.order_id = o.id
     WHERE o.sales_rep_id = $1 ORDER BY o.ordered_at DESC LIMIT 200)
    UNION ALL
    (SELECT i.wine_id, r.created_at
     FROM order_request r JOIN order_request_item i ON i.request_id = r.id
     WHERE r.sales_rep_id = $1 ORDER BY r.created_at DESC LIMIT 200)
  ), latest AS (
    SELECT wine_id, max(at) AS at FROM activity GROUP BY wine_id
  )
  SELECT w.id, w.name, w.producer, w.vintage, w.region, w.size_ml AS "sizeMl", w.sku, w.available
  FROM latest l JOIN wine w ON w.id = l.wine_id
  ORDER BY l.at DESC, w.id
  LIMIT 10
```
