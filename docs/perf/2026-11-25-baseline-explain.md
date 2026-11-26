# Baseline EXPLAIN (ANALYZE, BUFFERS), 2026-11-25

Plans of the main queries of the API on the perf database, before any optimization. The SQL and parameters are in `queries.sql`; the report that reads these plans is `baseline.md`.

## Setup

- Code: `develop` at 520001d. No app or schema changes.
- Database: `vintner_perf`, freshly seeded with `pnpm db:seed:scale` (20,000 order requests, 2,001,552 historical order items, 500,000 historical orders, 20,000 wines, 5,000 customers, 50 sales reps). The EXPLAINs were taken before the `pnpm bench baseline` run, which adds 2,000 requests.
- PostgreSQL 18.7 in Docker, `shared_buffers` 128MB, `work_mem` 4MB, container `shm_size` 256mb. Apple M1, 8 GB RAM.
- Each query ran 3 times; the plan below is the third run, so it is warm as far as the cache allows (Q6 still reads from disk: see its plan).
- The SQL is what the app sends, captured from the Postgres statement log while calling every endpoint.
- Q8: the plan has 20,000 ids in its Filter line; the line is truncated here.

## Summary

| Query | What | Planning ms | Execution ms |
| --- | --- | --- | --- |
| Q1 | GET /wines (catalog, no limit) | 0.861 | 29.434 |
| Q2 | GET /customers (no limit) | 0.105 | 10.393 |
| Q3 | last-time step 1: customer exists | 0.081 | 0.040 |
| Q4a | last-time step 2: newest activity, heavy customer | 0.388 | 107.755 |
| Q4b | last-time step 2: newest activity, light customer | 0.180 | 0.128 |
| Q5 | last-time step 3: items of that activity | 0.245 | 0.033 |
| Q6 | GET /recent-wines (current rep) | 0.401 | 327.661 |
| Q7 | GET /order-requests step 1: every saved request with customer and rep | 0.438 | 89.871 |
| Q8 | GET /order-requests step 2: items of all 20,000 requests with their wine | 52.261 | 179.515 |
| Q9 | GET /order-requests/count | 0.089 | 6.784 |
| Q10a | POST /order-requests: idempotency lookup | 0.167 | 0.058 |
| Q10b | POST /order-requests: availability of 5 wines | 0.487 | 0.106 |

## Q1. GET /wines (catalog, no limit)

Planning 0.861 ms, execution 29.434 ms.

```
Sort  (cost=1936.77..1986.77 rows=20000 width=82) (actual time=27.732..28.650 rows=20000.00 loops=1)
  Sort Key: name, vintage, size_ml, sku
  Sort Method: quicksort  Memory: 2809kB
  Buffers: shared hit=314
  ->  Seq Scan on wine "Wine"  (cost=0.00..508.00 rows=20000 width=82) (actual time=0.027..2.407 rows=20000.00 loops=1)
        Buffers: shared hit=308
Planning:
  Buffers: shared hit=127
Planning Time: 0.861 ms
Execution Time: 29.434 ms
```

## Q2. GET /customers (no limit)

Planning 0.105 ms, execution 10.393 ms.

```
Sort  (cost=434.19..446.69 rows=5000 width=91) (actual time=9.972..10.221 rows=5000.00 loops=1)
  Sort Key: name, id
  Sort Method: quicksort  Memory: 741kB
  Buffers: shared hit=80
  ->  Seq Scan on customer "Customer"  (cost=0.00..127.00 rows=5000 width=91) (actual time=0.008..0.331 rows=5000.00 loops=1)
        Buffers: shared hit=77
Planning:
  Buffers: shared hit=35
Planning Time: 0.105 ms
Execution Time: 10.393 ms
```

## Q3. last-time step 1: customer exists

Planning 0.081 ms, execution 0.040 ms.

```
Limit  (cost=4.30..4.31 rows=1 width=4) (actual time=0.022..0.022 rows=1.00 loops=1)
  Buffers: shared hit=3
  InitPlan 1
    ->  Index Only Scan using "PK_a7a13f4cacb744524e44dfdad32" on customer "Customer"  (cost=0.28..4.30 rows=1 width=0) (actual time=0.020..0.020 rows=1.00 loops=1)
          Index Cond: (id = '88e2482b-4981-49ea-a29e-9725e2e3b698'::uuid)
          Heap Fetches: 0
          Index Searches: 1
          Buffers: shared hit=3
  ->  Result  (cost=0.00..0.01 rows=1 width=4) (actual time=0.021..0.021 rows=1.00 loops=1)
        One-Time Filter: (InitPlan 1).col1
        Buffers: shared hit=3
Planning Time: 0.081 ms
Execution Time: 0.040 ms
```

## Q4a. last-time step 2: newest activity, heavy customer

Planning 0.388 ms, execution 107.755 ms.

```
Limit  (cost=67237.83..67237.83 rows=1 width=124) (actual time=107.732..107.733 rows=1.00 loops=1)
  Buffers: shared hit=41270
  ->  Sort  (cost=67237.83..67329.59 rows=36703 width=124) (actual time=107.731..107.732 rows=1.00 loops=1)
        Sort Key: "*SELECT* 1".at DESC, "*SELECT* 1".rank, "*SELECT* 1".id
        Sort Method: top-N heapsort  Memory: 25kB
        Buffers: shared hit=41270
        ->  Append  (cost=1236.85..67054.31 rows=36703 width=124) (actual time=2.508..102.693 rows=35874.00 loops=1)
              Buffers: shared hit=41267
              ->  Subquery Scan on "*SELECT* 1"  (cost=1236.85..66855.10 rows=36700 width=124) (actual time=2.507..99.590 rows=35873.00 loops=1)
                    Buffers: shared hit=41264
                    ->  Bitmap Heap Scan on historical_order o  (cost=1236.85..66488.10 rows=36700 width=124) (actual time=2.507..96.439 rows=35873.00 loops=1)
                          Recheck Cond: (customer_id = '88e2482b-4981-49ea-a29e-9725e2e3b698'::uuid)
                          Heap Blocks: exact=5150
                          Buffers: shared hit=41264
                          ->  Bitmap Index Scan on "IDX_44c867f590e8550df4467eeee9"  (cost=0.00..1227.67 rows=36700 width=0) (actual time=2.038..2.038 rows=35873.00 loops=1)
                                Index Cond: (customer_id = '88e2482b-4981-49ea-a29e-9725e2e3b698'::uuid)
                                Index Searches: 1
                                Buffers: shared hit=241
                          SubPlan 1
                            ->  Seq Scan on sales_rep  (cost=0.00..1.62 rows=1 width=13) (actual time=0.001..0.002 rows=1.00 loops=35873)
                                  Filter: (id = o.sales_rep_id)
                                  Rows Removed by Filter: 49
                                  Buffers: shared hit=35873
              ->  Subquery Scan on "*SELECT* 2"  (cost=4.31..15.70 rows=3 width=105) (actual time=0.022..0.022 rows=1.00 loops=1)
                    Buffers: shared hit=3
                    ->  Bitmap Heap Scan on order_request r  (cost=4.31..15.67 rows=3 width=105) (actual time=0.021..0.021 rows=1.00 loops=1)
                          Recheck Cond: (customer_id = '88e2482b-4981-49ea-a29e-9725e2e3b698'::uuid)
                          Heap Blocks: exact=1
                          Buffers: shared hit=3
                          ->  Bitmap Index Scan on "IDX_cfa9bd82c4c885ab43f4c6ed9b"  (cost=0.00..4.31 rows=3 width=0) (actual time=0.009..0.010 rows=1.00 loops=1)
                                Index Cond: (customer_id = '88e2482b-4981-49ea-a29e-9725e2e3b698'::uuid)
                                Index Searches: 1
                                Buffers: shared hit=2
Planning:
  Buffers: shared hit=216
Planning Time: 0.388 ms
Execution Time: 107.755 ms
```

## Q4b. last-time step 2: newest activity, light customer

Planning 0.180 ms, execution 0.128 ms.

```
Limit  (cost=361.34..361.34 rows=1 width=123) (actual time=0.097..0.098 rows=1.00 loops=1)
  Buffers: shared hit=20
  ->  Sort  (cost=361.34..361.50 rows=67 width=123) (actual time=0.097..0.097 rows=1.00 loops=1)
        Sort Key: "*SELECT* 1".at DESC, "*SELECT* 1".rank, "*SELECT* 1".id
        Sort Method: top-N heapsort  Memory: 25kB
        Buffers: shared hit=20
        ->  Append  (cost=4.92..361.00 rows=67 width=123) (actual time=0.033..0.089 rows=9.00 loops=1)
              Buffers: shared hit=20
              ->  Subquery Scan on "*SELECT* 1"  (cost=4.92..344.97 rows=64 width=124) (actual time=0.032..0.066 rows=6.00 loops=1)
                    Buffers: shared hit=15
                    ->  Bitmap Heap Scan on historical_order o  (cost=4.92..344.33 rows=64 width=124) (actual time=0.032..0.052 rows=6.00 loops=1)
                          Recheck Cond: (customer_id = '7e0f3369-d5e9-4908-b094-ae84dc012109'::uuid)
                          Heap Blocks: exact=6
                          Buffers: shared hit=15
                          ->  Bitmap Index Scan on "IDX_44c867f590e8550df4467eeee9"  (cost=0.00..4.90 rows=64 width=0) (actual time=0.010..0.010 rows=6.00 loops=1)
                                Index Cond: (customer_id = '7e0f3369-d5e9-4908-b094-ae84dc012109'::uuid)
                                Index Searches: 1
                                Buffers: shared hit=3
                          SubPlan 1
                            ->  Seq Scan on sales_rep  (cost=0.00..1.62 rows=1 width=13) (actual time=0.002..0.003 rows=1.00 loops=6)
                                  Filter: (id = o.sales_rep_id)
                                  Rows Removed by Filter: 49
                                  Buffers: shared hit=6
              ->  Subquery Scan on "*SELECT* 2"  (cost=4.31..15.70 rows=3 width=105) (actual time=0.018..0.021 rows=3.00 loops=1)
                    Buffers: shared hit=5
                    ->  Bitmap Heap Scan on order_request r  (cost=4.31..15.67 rows=3 width=105) (actual time=0.018..0.021 rows=3.00 loops=1)
                          Recheck Cond: (customer_id = '7e0f3369-d5e9-4908-b094-ae84dc012109'::uuid)
                          Heap Blocks: exact=3
                          Buffers: shared hit=5
                          ->  Bitmap Index Scan on "IDX_cfa9bd82c4c885ab43f4c6ed9b"  (cost=0.00..4.31 rows=3 width=0) (actual time=0.003..0.003 rows=3.00 loops=1)
                                Index Cond: (customer_id = '7e0f3369-d5e9-4908-b094-ae84dc012109'::uuid)
                                Index Searches: 1
                                Buffers: shared hit=2
Planning Time: 0.180 ms
Execution Time: 0.128 ms
```

## Q5. last-time step 3: items of that activity

Planning 0.245 ms, execution 0.033 ms.

```
Sort  (cost=66.10..66.11 rows=5 width=86) (actual time=0.025..0.025 rows=2.00 loops=1)
  Sort Key: w.name, w.vintage, w.size_ml, w.sku
  Sort Method: quicksort  Memory: 25kB
  Buffers: shared hit=10
  ->  Nested Loop  (cost=0.71..66.04 rows=5 width=86) (actual time=0.012..0.019 rows=2.00 loops=1)
        Buffers: shared hit=10
        ->  Index Scan using "IDX_67416a6d254c7af3e601f67bb3" on historical_order_item i  (cost=0.43..24.51 rows=5 width=20) (actual time=0.007..0.007 rows=2.00 loops=1)
              Index Cond: (order_id = 'c3bd5124-9866-4f5a-9b48-92ead43b5c89'::uuid)
              Index Searches: 1
              Buffers: shared hit=4
        ->  Index Scan using "PK_37fafeb69e78f7c842d28cf5005" on wine w  (cost=0.29..8.30 rows=1 width=82) (actual time=0.005..0.005 rows=1.00 loops=2)
              Index Cond: (id = i.wine_id)
              Index Searches: 2
              Buffers: shared hit=6
Planning:
  Buffers: shared hit=89
Planning Time: 0.245 ms
Execution Time: 0.033 ms
```

## Q6. GET /recent-wines (current rep)

Planning 0.401 ms, execution 327.661 ms.

```
Limit  (cost=45762.16..45762.18 rows=10 width=90) (actual time=325.878..327.494 rows=10.00 loops=1)
  Buffers: shared hit=15374 read=12022 written=97
  ->  Sort  (cost=45762.16..45762.66 rows=200 width=90) (actual time=325.878..327.492 rows=10.00 loops=1)
        Sort Key: l.at DESC, w.id
        Sort Method: top-N heapsort  Memory: 27kB
        Buffers: shared hit=15374 read=12022 written=97
        ->  Hash Join  (cost=45197.32..45757.84 rows=200 width=90) (actual time=315.683..324.329 rows=18762.00 loops=1)
              Hash Cond: (w.id = l.wine_id)
              Buffers: shared hit=15374 read=12022 written=97
              ->  Seq Scan on wine w  (cost=0.00..508.00 rows=20000 width=82) (actual time=0.004..2.822 rows=20000.00 loops=1)
                    Buffers: shared hit=308
              ->  Hash  (cost=45194.82..45194.82 rows=200 width=24) (actual time=315.671..317.284 rows=18762.00 loops=1)
                    Buckets: 32768 (originally 1024)  Batches: 1 (originally 1)  Memory Usage: 1283kB
                    Buffers: shared hit=15066 read=12022 written=97
                    ->  Subquery Scan on l  (cost=45132.52..45194.82 rows=200 width=24) (actual time=289.456..307.574 rows=18762.00 loops=1)
                          Buffers: shared hit=15066 read=12022 written=97
                          ->  Finalize GroupAggregate  (cost=45132.52..45192.82 rows=200 width=24) (actual time=289.455..305.582 rows=18762.00 loops=1)
                                Group Key: i.wine_id
                                Buffers: shared hit=15066 read=12022 written=97
                                ->  Gather Merge  (cost=45132.52..45188.42 rows=480 width=24) (actual time=289.450..298.847 rows=41853.00 loops=1)
                                      Workers Planned: 2
                                      Workers Launched: 2
                                      Buffers: shared hit=15066 read=12022 written=97
                                      ->  Sort  (cost=44132.50..44133.00 rows=200 width=24) (actual time=286.444..288.710 rows=13951.00 loops=3)
                                            Sort Key: i.wine_id
                                            Sort Method: quicksort  Memory: 914kB
                                            Buffers: shared hit=15066 read=12022 written=97
                                            Worker 0:  Sort Method: quicksort  Memory: 958kB
                                            Worker 1:  Sort Method: quicksort  Memory: 916kB
                                            ->  Partial HashAggregate  (cost=44122.85..44124.85 rows=200 width=24) (actual time=282.013..283.403 rows=13951.00 loops=3)
                                                  Group Key: i.wine_id
                                                  Batches: 1  Memory Usage: 1065kB
                                                  Buffers: shared hit=15052 read=12022 written=97
                                                  Worker 0:  Batches: 1  Memory Usage: 1321kB
                                                  Worker 1:  Batches: 1  Memory Usage: 1321kB
                                                  ->  Parallel Append  (cost=825.73..43058.59 rows=212852 width=24) (actual time=18.529..239.847 rows=172385.67 loops=3)
                                                        Buffers: shared hit=15052 read=12022 written=97
                                                        ->  Hash Join  (cost=825.73..2429.05 rows=17331 width=24) (actual time=2.636..15.503 rows=17332.00 loops=1)
                                                              Hash Cond: (i.request_id = r.id)
                                                              Buffers: shared hit=1284
                                                              ->  Seq Scan on order_request_item i  (cost=0.00..1419.84 rows=69884 width=32) (actual time=0.009..5.399 rows=69884.00 loops=1)
                                                                    Buffers: shared hit=721
                                                              ->  Hash  (cost=763.73..763.73 rows=4960 width=24) (actual time=2.593..2.600 rows=4960.00 loops=1)
                                                                    Buckets: 8192  Batches: 1  Memory Usage: 336kB
                                                                    Buffers: shared hit=563
                                                                    ->  Bitmap Heap Scan on order_request r  (cost=170.73..763.73 rows=4960 width=24) (actual time=0.341..1.977 rows=4960.00 loops=1)
                                                                          Recheck Cond: (sales_rep_id = 'a1000000-0000-4000-8000-000000000001'::uuid)
                                                                          Buffers: shared hit=563
                                                                          ->  Bitmap Index Scan on "IDX_d2eb7934039a0a98083315df80"  (cost=0.00..169.49 rows=4960 width=0) (actual time=0.283..0.283 rows=4960.00 loops=1)
                                                                                Index Cond: (sales_rep_id = 'a1000000-0000-4000-8000-000000000001'::uuid)
                                                                                Index Searches: 1
                                                                                Buffers: shared hit=32
                                                        ->  Parallel Hash Join  (cost=8401.27..39565.29 rows=205631 width=24) (actual time=19.103..219.539 rows=166608.33 loops=3)
                                                              Hash Cond: (i_1.order_id = o.id)
                                                              Buffers: shared hit=13768 read=12022 written=97
                                                              ->  Parallel Seq Scan on historical_order_item i_1  (cost=0.00..28974.80 rows=833980 width=32) (actual time=0.431..74.621 rows=667184.00 loops=3)
                                                                    Buffers: shared hit=8613 read=12022 written=97
                                                              ->  Parallel Hash  (cost=7759.17..7759.17 rows=51368 width=24) (actual time=18.189..18.190 rows=41594.00 loops=3)
                                                                    Buckets: 131072  Batches: 1  Memory Usage: 7904kB
                                                                    Buffers: shared hit=5155
                                                                    ->  Parallel Seq Scan on historical_order o  (cost=0.00..7759.17 rows=51368 width=24) (actual time=0.006..9.807 rows=41594.00 loops=3)
                                                                          Filter: (sales_rep_id = 'a1000000-0000-4000-8000-000000000001'::uuid)
                                                                          Rows Removed by Filter: 125073
                                                                          Buffers: shared hit=5155
Planning:
  Buffers: shared hit=101
Planning Time: 0.401 ms
Execution Time: 327.661 ms
```

## Q7. GET /order-requests step 1: every saved request with customer and rep

Planning 0.438 ms, execution 89.871 ms.

```
Sort  (cost=5470.89..5520.89 rows=20000 width=322) (actual time=83.028..86.815 rows=20000.00 loops=1)
  Sort Key: "OrderRequest".created_at DESC, "OrderRequest".id
  Sort Method: external merge  Disk: 6720kB
  Buffers: shared hit=609, temp read=840 written=841
  ->  Hash Join  (cost=191.62..1032.12 rows=20000 width=322) (actual time=1.331..13.586 rows=20000.00 loops=1)
        Hash Cond: ("OrderRequest".sales_rep_id = "OrderRequest__OrderRequest_salesRep".id)
        Buffers: shared hit=609
        ->  Hash Join  (cost=189.50..973.04 rows=20000 width=273) (actual time=1.311..10.308 rows=20000.00 loops=1)
              Hash Cond: ("OrderRequest".customer_id = "OrderRequest__OrderRequest_customer".id)
              Buffers: shared hit=608
              ->  Seq Scan on order_request "OrderRequest"  (cost=0.00..731.00 rows=20000 width=182) (actual time=0.006..2.866 rows=20000.00 loops=1)
                    Buffers: shared hit=531
              ->  Hash  (cost=127.00..127.00 rows=5000 width=91) (actual time=1.298..1.299 rows=5000.00 loops=1)
                    Buckets: 8192  Batches: 1  Memory Usage: 674kB
                    Buffers: shared hit=77
                    ->  Seq Scan on customer "OrderRequest__OrderRequest_customer"  (cost=0.00..127.00 rows=5000 width=91) (actual time=0.003..0.581 rows=5000.00 loops=1)
                          Buffers: shared hit=77
        ->  Hash  (cost=1.50..1.50 rows=50 width=49) (actual time=0.018..0.018 rows=50.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 12kB
              Buffers: shared hit=1
              ->  Seq Scan on sales_rep "OrderRequest__OrderRequest_salesRep"  (cost=0.00..1.50 rows=50 width=49) (actual time=0.006..0.009 rows=50.00 loops=1)
                    Buffers: shared hit=1
Planning:
  Buffers: shared hit=45
Planning Time: 0.438 ms
Execution Time: 89.871 ms
```

## Q8. GET /order-requests step 2: items of all 20,000 requests with their wine

Planning 52.261 ms, execution 179.515 ms.

```
Sort  (cost=9680.40..9797.22 rows=46725 width=138) (actual time=164.761..176.023 rows=69884.00 loops=1)
  Sort Key: "OrderRequestItem__OrderRequestItem_wine".name, "OrderRequestItem".wine_id
  Sort Method: external merge  Disk: 10464kB
  Buffers: shared hit=1035, temp read=1308 written=1311
  ->  Hash Join  (cost=808.00..2699.94 rows=46725 width=138) (actual time=26.352..73.240 rows=69884.00 loops=1)
        Hash Cond: ("OrderRequestItem".wine_id = "OrderRequestItem__OrderRequestItem_wine".id)
        Buffers: shared hit=1029
        ->  Seq Scan on order_request_item "OrderRequestItem"  (cost=50.00..1819.26 rows=46725 width=56) (actual time=2.123..23.816 rows=69884.00 loops=1)
              Filter: (request_id = ANY ('{45bf78f5-4b23-45ac-8402-92fad27d13ef,39df774b-9325-4973-bc07-4d55bbb7d50b,eb22a34b-e5d7-4f3a-b6c7-0fc9c492a8a8,... 20,000 ids ...}'::uuid[]))
              Buffers: shared hit=721
        ->  Hash  (cost=508.00..508.00 rows=20000 width=82) (actual time=17.195..17.196 rows=20000.00 loops=1)
              Buckets: 32768  Batches: 1  Memory Usage: 2575kB
              Buffers: shared hit=308
              ->  Seq Scan on wine "OrderRequestItem__OrderRequestItem_wine"  (cost=0.00..508.00 rows=20000 width=82) (actual time=0.116..7.088 rows=20000.00 loops=1)
                    Buffers: shared hit=308
Planning:
  Buffers: shared hit=246
Planning Time: 52.261 ms
Execution Time: 179.515 ms
```

## Q9. GET /order-requests/count

Planning 0.089 ms, execution 6.784 ms.

```
Aggregate  (cost=714.29..714.30 rows=1 width=8) (actual time=6.753..6.754 rows=1.00 loops=1)
  Buffers: shared hit=91
  ->  Index Only Scan using "UQ_8018e06aeddd0dc97a2c7168145" on order_request "OrderRequest"  (cost=0.29..664.29 rows=20000 width=0) (actual time=0.013..5.146 rows=20000.00 loops=1)
        Heap Fetches: 0
        Index Searches: 1
        Buffers: shared hit=91
Planning:
  Buffers: shared hit=6
Planning Time: 0.089 ms
Execution Time: 6.784 ms
```

## Q10a. POST /order-requests: idempotency lookup

Planning 0.167 ms, execution 0.058 ms.

```
Limit  (cost=0.29..8.30 rows=1 width=182) (actual time=0.012..0.029 rows=0.00 loops=1)
  Buffers: shared hit=2
  ->  Index Scan using "UQ_8018e06aeddd0dc97a2c7168145" on order_request "OrderRequest"  (cost=0.29..8.30 rows=1 width=182) (actual time=0.011..0.011 rows=0.00 loops=1)
        Index Cond: (idempotency_key = 'dbd59d72-41d4-4983-9232-7a8cb7504aa2'::uuid)
        Index Searches: 1
        Buffers: shared hit=2
Planning Time: 0.167 ms
Execution Time: 0.058 ms
```

## Q10b. POST /order-requests: availability of 5 wines

Planning 0.487 ms, execution 0.106 ms.

```
Bitmap Heap Scan on wine "Wine"  (cost=21.48..39.65 rows=5 width=20) (actual time=0.048..0.091 rows=5.00 loops=1)
  Recheck Cond: (id = ANY ('{000752f1-0362-413d-a308-ef1465338348,00086597-8d46-4040-b008-17b5c65cbeef,000b5eaf-f455-4056-8bf6-b9bb3277c29e,000bcb50-fa64-48f9-8cf4-4e6c9370d6f3,000cc5d1-7685-4fb7-90d3-b626138449a2}'::uuid[]))
  Heap Blocks: exact=5
  Buffers: shared hit=7
  ->  Bitmap Index Scan on "PK_37fafeb69e78f7c842d28cf5005"  (cost=0.00..21.48 rows=5 width=0) (actual time=0.029..0.029 rows=5.00 loops=1)
        Index Cond: (id = ANY ('{000752f1-0362-413d-a308-ef1465338348,00086597-8d46-4040-b008-17b5c65cbeef,000b5eaf-f455-4056-8bf6-b9bb3277c29e,000bcb50-fa64-48f9-8cf4-4e6c9370d6f3,000cc5d1-7685-4fb7-90d3-b626138449a2}'::uuid[]))
        Index Searches: 1
        Buffers: shared hit=2
Planning Time: 0.487 ms
Execution Time: 0.106 ms
ERROR:  syntax error at or near "ORDER"
LINE 1: ...cda494', 'c385274e-a0eb-494f-8c03-79a180d92a5c')) ORDER BY "...
                                                            ^
```
