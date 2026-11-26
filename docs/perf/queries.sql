-- Main queries of the API, exactly as the app runs them (captured from the Postgres statement log
-- on vintner_perf while calling every endpoint). Re-run the whole set after each optimization and
-- compare with docs/perf/2026-11-25-baseline-explain.md.
--
-- How: psql against vintner_perf, for example
--   docker compose exec -T postgres psql -U vintner -d vintner_perf < docs/perf/queries.sql
-- Q8 uses \gexec, so it needs psql (not DBeaver). Run each query 3 times and keep the third:
-- the first runs warm the cache.
--
-- Parameters: heavy customer 88e2482b-4981-49ea-a29e-9725e2e3b698 (35,873 orders), light customer
-- 7e0f3369-d5e9-4908-b094-ae84dc012109 (6 orders), current sales rep a1000000-0000-4000-8000-000000000001.
-- The ids in Q5 and Q10 come from the seed and stay the same after a reseed.

-- Q1. GET /wines (catalog, TypeORM find, no limit)
EXPLAIN (ANALYZE, BUFFERS) SELECT "Wine"."id" AS "Wine_id", "Wine"."name" AS "Wine_name", "Wine"."producer" AS "Wine_producer", "Wine"."vintage" AS "Wine_vintage", "Wine"."region" AS "Wine_region", "Wine"."size_ml" AS "Wine_size_ml", "Wine"."sku" AS "Wine_sku", "Wine"."available" AS "Wine_available" FROM "wine" "Wine" ORDER BY "Wine_name" ASC, "Wine_vintage" ASC NULLS LAST, "Wine_size_ml" ASC, "Wine_sku" ASC;

-- Q2. GET /customers (TypeORM find, no limit)
EXPLAIN (ANALYZE, BUFFERS) SELECT "Customer"."id" AS "Customer_id", "Customer"."name" AS "Customer_name", "Customer"."contact_name" AS "Customer_contact_name", "Customer"."email" AS "Customer_email", "Customer"."phone" AS "Customer_phone" FROM "customer" "Customer" ORDER BY "Customer_name" ASC, "Customer_id" ASC;

-- Q3. GET /customers/:id/last-time, step 1 "customer exists" (also used by POST /order-requests)
EXPLAIN (ANALYZE, BUFFERS) SELECT 1 AS "row_exists" FROM (SELECT 1 AS dummy_column) "dummy_table" WHERE EXISTS (SELECT 1 FROM "customer" "Customer" WHERE (("Customer"."id" = '88e2482b-4981-49ea-a29e-9725e2e3b698'))) LIMIT 1;

-- Q4a. last-time step 2, newest activity -- HEAVY customer
EXPLAIN (ANALYZE, BUFFERS)
  SELECT kind, id, at, sales_rep_name, contact_name FROM (
    SELECT 'order' AS kind, 0 AS rank, o.id, o.ordered_at AS at,
      (SELECT name FROM sales_rep WHERE id = o.sales_rep_id) AS sales_rep_name,
      NULL AS contact_name
    FROM historical_order o WHERE o.customer_id = '88e2482b-4981-49ea-a29e-9725e2e3b698'
    UNION ALL
    SELECT 'request', 1, r.id, r.created_at, NULL, r.contact_name
    FROM order_request r WHERE r.customer_id = '88e2482b-4981-49ea-a29e-9725e2e3b698'
  ) activity
  ORDER BY at DESC, rank, id
  LIMIT 1;

-- Q4b. same, LIGHT customer
EXPLAIN (ANALYZE, BUFFERS)
  SELECT kind, id, at, sales_rep_name, contact_name FROM (
    SELECT 'order' AS kind, 0 AS rank, o.id, o.ordered_at AS at,
      (SELECT name FROM sales_rep WHERE id = o.sales_rep_id) AS sales_rep_name,
      NULL AS contact_name
    FROM historical_order o WHERE o.customer_id = '7e0f3369-d5e9-4908-b094-ae84dc012109'
    UNION ALL
    SELECT 'request', 1, r.id, r.created_at, NULL, r.contact_name
    FROM order_request r WHERE r.customer_id = '7e0f3369-d5e9-4908-b094-ae84dc012109'
  ) activity
  ORDER BY at DESC, rank, id
  LIMIT 1;

-- Q5. last-time step 3, the items of that activity (heavy customer's newest: c3bd5124-9866-4f5a-9b48-92ead43b5c89)
--     If Q4a returned kind='request', swap historical_order_item/order_id for order_request_item/request_id.
EXPLAIN (ANALYZE, BUFFERS)
  SELECT i.quantity, w.id, w.name, w.producer, w.vintage, w.region, w.size_ml AS "sizeMl", w.sku, w.available
  FROM historical_order_item i JOIN wine w ON w.id = i.wine_id
  WHERE i.order_id = 'c3bd5124-9866-4f5a-9b48-92ead43b5c89'
  ORDER BY w.name, w.vintage NULLS LAST, w.size_ml, w.sku;

-- Q6. GET /recent-wines (current rep, ~25% of all orders)
EXPLAIN (ANALYZE, BUFFERS)
  WITH activity AS (
    SELECT i.wine_id, o.ordered_at AS at
    FROM historical_order o JOIN historical_order_item i ON i.order_id = o.id
    WHERE o.sales_rep_id = 'a1000000-0000-4000-8000-000000000001'
    UNION ALL
    SELECT i.wine_id, r.created_at
    FROM order_request r JOIN order_request_item i ON i.request_id = r.id
    WHERE r.sales_rep_id = 'a1000000-0000-4000-8000-000000000001'
  ), latest AS (
    SELECT wine_id, max(at) AS at FROM activity GROUP BY wine_id
  )
  SELECT w.id, w.name, w.producer, w.vintage, w.region, w.size_ml AS "sizeMl", w.sku, w.available
  FROM latest l JOIN wine w ON w.id = l.wine_id
  ORDER BY l.at DESC, w.id
  LIMIT 10;

-- Q7. GET /order-requests, step 1: every saved request with customer and sales rep (no limit)
EXPLAIN (ANALYZE, BUFFERS) SELECT "OrderRequest"."id" AS "OrderRequest_id", "OrderRequest"."idempotency_key" AS "OrderRequest_idempotency_key", "OrderRequest"."request_hash" AS "OrderRequest_request_hash", "OrderRequest"."customer_id" AS "OrderRequest_customer_id", "OrderRequest"."sales_rep_id" AS "OrderRequest_sales_rep_id", "OrderRequest"."contact_name" AS "OrderRequest_contact_name", "OrderRequest"."phone" AS "OrderRequest_phone", "OrderRequest"."notes" AS "OrderRequest_notes", "OrderRequest"."inventory_policy" AS "OrderRequest_inventory_policy", "OrderRequest"."created_at" AS "OrderRequest_created_at", "OrderRequest__OrderRequest_customer"."id" AS "OrderRequest__OrderRequest_customer_id", "OrderRequest__OrderRequest_customer"."name" AS "OrderRequest__OrderRequest_customer_name", "OrderRequest__OrderRequest_customer"."contact_name" AS "OrderRequest__OrderRequest_customer_contact_name", "OrderRequest__OrderRequest_customer"."email" AS "OrderRequest__OrderRequest_customer_email", "OrderRequest__OrderRequest_customer"."phone" AS "OrderRequest__OrderRequest_customer_phone", "OrderRequest__OrderRequest_salesRep"."id" AS "OrderRequest__OrderRequest_salesRep_id", "OrderRequest__OrderRequest_salesRep"."name" AS "OrderRequest__OrderRequest_salesRep_name", "OrderRequest__OrderRequest_salesRep"."email" AS "OrderRequest__OrderRequest_salesRep_email" FROM "order_request" "OrderRequest" INNER JOIN "customer" "OrderRequest__OrderRequest_customer" ON "OrderRequest__OrderRequest_customer"."id"="OrderRequest"."customer_id"  INNER JOIN "sales_rep" "OrderRequest__OrderRequest_salesRep" ON "OrderRequest__OrderRequest_salesRep"."id"="OrderRequest"."sales_rep_id" ORDER BY "OrderRequest"."created_at" DESC, "OrderRequest"."id" ASC;

-- Q8. GET /order-requests, step 2: the items of ALL 20,000 requests with their wine.
--     The app sends IN ($1 ... $20000), one parameter per request id from Q7. Shape:
--     EXPLAIN (ANALYZE, BUFFERS) SELECT "OrderRequestItem"."id" AS "OrderRequestItem_id", "OrderRequestItem"."request_id" AS "OrderRequestItem_request_id", "OrderRequestItem"."wine_id" AS "OrderRequestItem_wine_id", "OrderRequestItem"."quantity" AS "OrderRequestItem_quantity", "OrderRequestItem"."available_at_save" AS "OrderRequestItem_available_at_save", "OrderRequestItem__OrderRequestItem_wine"."id" AS "OrderRequestItem__OrderRequestItem_wine_id", "OrderRequestItem__OrderRequestItem_wine"."name" AS "OrderRequestItem__OrderRequestItem_wine_name", "OrderRequestItem__OrderRequestItem_wine"."producer" AS "OrderRequestItem__OrderRequestItem_wine_producer", "OrderRequestItem__OrderRequestItem_wine"."vintage" AS "OrderRequestItem__OrderRequestItem_wine_vintage", "OrderRequestItem__OrderRequestItem_wine"."region" AS "OrderRequestItem__OrderRequestItem_wine_region", "OrderRequestItem__OrderRequestItem_wine"."size_ml" AS "OrderRequestItem__OrderRequestItem_wine_size_ml", "OrderRequestItem__OrderRequestItem_wine"."sku" AS "OrderRequestItem__OrderRequestItem_wine_sku", "OrderRequestItem__OrderRequestItem_wine"."available" AS "OrderRequestItem__OrderRequestItem_wine_available" FROM "order_request_item" "OrderRequestItem" INNER JOIN "wine" "OrderRequestItem__OrderRequestItem_wine" ON "OrderRequestItem__OrderRequestItem_wine"."id"="OrderRequestItem"."wine_id" WHERE (("OrderRequestItem"."request_id" IN ($1, $2, ... $20000))) ORDER BY "OrderRequestItem__OrderRequestItem_wine"."name" ASC, "OrderRequestItem__OrderRequestItem_wine"."id" ASC;
--     To run it with the real ids, build the statement from order_request and execute it with \gexec:
SELECT format($q$EXPLAIN (ANALYZE, BUFFERS) SELECT "OrderRequestItem"."id" AS "OrderRequestItem_id", "OrderRequestItem"."request_id" AS "OrderRequestItem_request_id", "OrderRequestItem"."wine_id" AS "OrderRequestItem_wine_id", "OrderRequestItem"."quantity" AS "OrderRequestItem_quantity", "OrderRequestItem"."available_at_save" AS "OrderRequestItem_available_at_save", "OrderRequestItem__OrderRequestItem_wine"."id" AS "OrderRequestItem__OrderRequestItem_wine_id", "OrderRequestItem__OrderRequestItem_wine"."name" AS "OrderRequestItem__OrderRequestItem_wine_name", "OrderRequestItem__OrderRequestItem_wine"."producer" AS "OrderRequestItem__OrderRequestItem_wine_producer", "OrderRequestItem__OrderRequestItem_wine"."vintage" AS "OrderRequestItem__OrderRequestItem_wine_vintage", "OrderRequestItem__OrderRequestItem_wine"."region" AS "OrderRequestItem__OrderRequestItem_wine_region", "OrderRequestItem__OrderRequestItem_wine"."size_ml" AS "OrderRequestItem__OrderRequestItem_wine_size_ml", "OrderRequestItem__OrderRequestItem_wine"."sku" AS "OrderRequestItem__OrderRequestItem_wine_sku", "OrderRequestItem__OrderRequestItem_wine"."available" AS "OrderRequestItem__OrderRequestItem_wine_available" FROM "order_request_item" "OrderRequestItem" INNER JOIN "wine" "OrderRequestItem__OrderRequestItem_wine" ON "OrderRequestItem__OrderRequestItem_wine"."id"="OrderRequestItem"."wine_id" WHERE (("OrderRequestItem"."request_id" IN (%s))) ORDER BY "OrderRequestItem__OrderRequestItem_wine"."name" ASC, "OrderRequestItem__OrderRequestItem_wine"."id" ASC$q$, string_agg(quote_literal(id::text), ', ' ORDER BY created_at DESC, id)) FROM order_request
\gexec

-- Q9. GET /order-requests/count
EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(1) AS "cnt" FROM "order_request" "OrderRequest";

-- Q10. POST /order-requests reads (inside the save transaction)
-- Q10a. idempotency lookup (unknown key -> new request)
EXPLAIN (ANALYZE, BUFFERS) SELECT "OrderRequest"."id" AS "OrderRequest_id", "OrderRequest"."idempotency_key" AS "OrderRequest_idempotency_key", "OrderRequest"."request_hash" AS "OrderRequest_request_hash", "OrderRequest"."customer_id" AS "OrderRequest_customer_id", "OrderRequest"."sales_rep_id" AS "OrderRequest_sales_rep_id", "OrderRequest"."contact_name" AS "OrderRequest_contact_name", "OrderRequest"."phone" AS "OrderRequest_phone", "OrderRequest"."notes" AS "OrderRequest_notes", "OrderRequest"."inventory_policy" AS "OrderRequest_inventory_policy", "OrderRequest"."created_at" AS "OrderRequest_created_at" FROM "order_request" "OrderRequest" WHERE (("OrderRequest"."idempotency_key" = 'dbd59d72-41d4-4983-9232-7a8cb7504aa2')) LIMIT 1;
-- Q10b. wine availability for 5 wines
EXPLAIN (ANALYZE, BUFFERS) SELECT "Wine"."id" AS "Wine_id", "Wine"."available" AS "Wine_available" FROM "wine" "Wine" WHERE (("Wine"."id" IN ('000752f1-0362-413d-a308-ef1465338348', '00086597-8d46-4040-b008-17b5c65cbeef', '000b5eaf-f455-4056-8bf6-b9bb3277c29e', '000bcb50-fa64-48f9-8cf4-4e6c9370d6f3', '000cc5d1-7685-4fb7-90d3-b626138449a2')));
