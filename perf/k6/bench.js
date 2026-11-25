import http from 'k6/http';
import exec from 'k6/execution';
import { Trend } from 'k6/metrics';
import { HEAVY_CUSTOMER_ID, LIGHT_CUSTOMER_ID } from './data.js';

const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:3001';

// Fixed load settings. Keep them in sync with the README and scripts/bench.mjs.
const VUS = 10;
const RAMP = '10s'; // warm-up: not counted in the results
const STEADY = '30s';
const POST_ITERATIONS = 2000;
const SLOT_SECONDS = 50; // each scenario starts one slot after the previous one

const READS = {
  wines: '/wines',
  customers: '/customers',
  last_time_heavy: `/customers/${HEAVY_CUSTOMER_ID}/last-time`,
  last_time_light: `/customers/${LIGHT_CUSTOMER_ID}/last-time`,
  recent_wines: '/recent-wines',
  requests_list: '/order-requests',
  requests_count: '/order-requests/count',
};
const ENDPOINTS = [...Object.keys(READS), 'requests_post'];

// First and last request time per endpoint, to compute requests per second.
const sentAt = new Trend('bench_sent_at');

const scenarios = {};
Object.keys(READS).forEach((name, i) => {
  scenarios[name] = {
    executor: 'ramping-vus',
    exec: 'read',
    env: { ENDPOINT: name },
    startTime: `${i * SLOT_SECONDS}s`,
    stages: [
      { duration: RAMP, target: VUS },
      { duration: STEADY, target: VUS },
    ],
    gracefulRampDown: '0s',
    gracefulStop: '10s',
  };
});
scenarios.requests_post = {
  executor: 'shared-iterations',
  exec: 'post',
  startTime: `${Object.keys(READS).length * SLOT_SECONDS}s`,
  vus: VUS,
  iterations: POST_ITERATIONS,
  maxDuration: '5m',
};

// Sub-metrics only exist in the summary when a threshold mentions them, so each
// endpoint gets a real error-rate threshold and a no-op one per metric.
const thresholds = { http_req_failed: ['rate<0.01'] };
for (const name of ENDPOINTS) {
  thresholds[`http_req_failed{endpoint:${name}}`] = ['rate<0.01'];
  thresholds[`http_req_duration{endpoint:${name}}`] = ['max>=0'];
  thresholds[`http_reqs{endpoint:${name}}`] = ['count>=0'];
  thresholds[`bench_sent_at{endpoint:${name}}`] = ['max>=0'];
}

export const options = {
  scenarios,
  thresholds,
  discardResponseBodies: true,
  summaryTrendStats: ['min', 'med', 'p(95)', 'p(99)', 'max'],
};

http.setResponseCallback(http.expectedStatuses(200));

const text = { responseType: 'text' };

export function setup() {
  const get = (path) => http.get(`${BASE_URL}${path}`, text);
  const policy = get('/settings/inventory-policy');
  if (policy.status !== 200) {
    throw new Error(
      `GET /settings/inventory-policy returned ${policy.status}; is the API up at ${BASE_URL}?`,
    );
  }
  if (policy.json('policy') !== 'strict') {
    throw new Error('The inventory policy must be "strict" for the benchmark.');
  }

  const customers = get('/customers').json();
  const customerIds = customers.map((c) => c.id);
  for (const id of [HEAVY_CUSTOMER_ID, LIGHT_CUSTOMER_ID]) {
    if (!customerIds.includes(id)) {
      throw new Error(
        `Customer ${id} not found. The seed changed; see perf/k6/data.js.`,
      );
    }
  }

  // Saving a request never lowers stock, so a wine with 50 or more units
  // always passes the strict check for the 1 to 5 units used below.
  const wines = get('/wines')
    .json()
    .filter((w) => w.available >= 50);
  if (wines.length < 100)
    throw new Error('Too few wines with stock; is this the perf database?');
  return {
    customerIds: customerIds.slice(0, 500),
    wineIds: wines.slice(0, 2000).map((w) => w.id),
  };
}

const startedAt = () => exec.scenario.startTime;

function track(res, endpoint) {
  sentAt.add(Date.now(), { endpoint });
  return res;
}

export function read() {
  const name = __ENV.ENDPOINT;
  const warmup = Date.now() - startedAt() < 10_000;
  const endpoint = warmup ? 'warmup' : name;
  track(
    http.get(`${BASE_URL}${READS[name]}`, { tags: { endpoint } }),
    endpoint,
  );
}

function uuidV4() {
  const hex = (n) =>
    Array.from({ length: n }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('');
  const variant = (8 + Math.floor(Math.random() * 4)).toString(16);
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${variant}${hex(3)}-${hex(12)}`;
}

const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

export function post(data) {
  const lineCount = 1 + Math.floor(Math.random() * 3);
  const wineIds = new Set();
  while (wineIds.size < lineCount) wineIds.add(pickOne(data.wineIds));
  const body = {
    customerId: pickOne(data.customerIds),
    contactName: 'Benchmark Caller',
    phone: '+1 555 0100 123',
    notes: '',
    lines: [...wineIds].map((wineId) => ({
      wineId,
      quantity: 1 + Math.floor(Math.random() * 5),
    })),
  };
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': uuidV4(),
    },
    tags: { endpoint: 'requests_post' },
    responseCallback: http.expectedStatuses(201),
  };
  track(
    http.post(`${BASE_URL}/order-requests`, JSON.stringify(body), params),
    'requests_post',
  );
}

export function handleSummary(data) {
  return { '/out/summary.json': JSON.stringify(data) };
}
