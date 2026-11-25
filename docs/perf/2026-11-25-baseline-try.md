# Benchmark: baseline-try

Result: **passed**

## Run

- Date: 2026-11-25T14:55:35.360Z
- Commit: 457595c (uncommitted changes)
- Machine: Apple M1, 8 logical CPUs, 8 GB RAM, darwin arm64
- k6: grafana/k6:2.4.0 through Docker; the API runs on the host, outside the container
- Saved order requests before / after the run: 20000 / 22000

## Load settings

- Read endpoints, one after another: 10 virtual users (VUs), 10 s ramp-up (not counted), then 30 s steady
- POST /order-requests: 10 VUs sharing 2000 requests, each with a fresh Idempotency-Key
- No pauses between requests. The run fails when any error rate is 1% or more

## Results

| Endpoint | Requests | req/s | p50 ms | p95 ms | p99 ms | Error rate |
| --- | --- | --- | --- | --- | --- | --- |
| GET /wines | 564 | 18.9 | 507.4 | 734.0 | 930.6 | 0.00% |
| GET /customers | 2792 | 93.1 | 103.6 | 152.2 | 186.7 | 0.00% |
| GET /customers/:id/last-time (heavy customer) | 1638 | 54.7 | 170.6 | 251.8 | 367.9 | 0.00% |
| GET /customers/:id/last-time (light customer) | 71338 | 2377.6 | 3.5 | 7.1 | 12.9 | 0.00% |
| GET /recent-wines | 301 | 10.1 | 798.4 | 1769.9 | 1893.4 | 0.00% |
| GET /order-requests | 41 | 1.4 | 7394.2 | 9414.5 | 12622.9 | 0.00% |
| GET /order-requests/count | 83767 | 2792.1 | 3.2 | 5.7 | 9.4 | 0.00% |
| POST /order-requests | 2000 | 904.2 | 9.8 | 17.6 | 24.4 | 0.00% |
