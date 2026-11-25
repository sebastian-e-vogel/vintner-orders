// Fixed ids from the deterministic scale seed (pnpm db:seed:scale). setup() in
// bench.js checks that both exist and aborts when the seed has changed.
//
// To regenerate (heaviest and lightest customer by historical orders):
//   SELECT c.id, (SELECT count(*) FROM historical_order o WHERE o.customer_id = c.id) AS n
//   FROM customer c ORDER BY n DESC LIMIT 1;   -- heavy; use ORDER BY n ASC, c.email for light
export const HEAVY_CUSTOMER_ID = '88e2482b-4981-49ea-a29e-9725e2e3b698'; // customer-3800, 35873 orders
export const LIGHT_CUSTOMER_ID = '7e0f3369-d5e9-4908-b094-ae84dc012109'; // customer-3773, 6 orders
