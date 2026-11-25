// `pnpm bench [label]`: runs perf/k6/bench.js in Docker and writes docs/perf/<date>-<label>.md.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';

const K6_IMAGE = 'grafana/k6:2.4.0';
const MAX_ERROR_RATE = 0.01;
const ENDPOINTS = [
  ['wines', 'GET /wines'],
  ['customers', 'GET /customers'],
  ['last_time_heavy', 'GET /customers/:id/last-time (heavy customer)'],
  ['last_time_light', 'GET /customers/:id/last-time (light customer)'],
  ['recent_wines', 'GET /recent-wines'],
  ['requests_list', 'GET /order-requests'],
  ['requests_count', 'GET /order-requests/count'],
  ['requests_post', 'POST /order-requests'],
];

const root = resolve(import.meta.dirname, '..');
const outDir = resolve(root, 'perf/out');
const label = process.argv[2] ?? 'run';
if (!/^[a-z0-9][a-z0-9-]*$/.test(label) || label.endsWith('explain')) {
  console.error(
    'Label: lowercase letters, digits and hyphens, not ending in "explain".',
  );
  process.exit(1);
}

// BENCH_BASE_URL is the API as seen from this machine; the container reaches it through the host.
const hostUrl = process.env.BENCH_BASE_URL ?? 'http://localhost:3001';
const containerUrl = hostUrl.replace(
  /\/\/(localhost|127\.0\.0\.1)/,
  '//host.docker.internal',
);

async function savedCount() {
  const res = await fetch(`${hostUrl}/order-requests/count`);
  return (await res.json()).count;
}

let before;
try {
  before = await savedCount();
} catch {
  console.error(
    `The API is not reachable at ${hostUrl}. Start it first (see README, "Run a benchmark").`,
  );
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const summaryPath = resolve(outDir, 'summary.json');
const k6 = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '-i',
    '--user',
    `${process.getuid()}:${process.getgid()}`,
    '--add-host=host.docker.internal:host-gateway',
    '-e',
    `BASE_URL=${containerUrl}`,
    '-v',
    `${resolve(root, 'perf/k6')}:/scripts:ro`,
    '-v',
    `${outDir}:/out`,
    K6_IMAGE,
    'run',
    '/scripts/bench.js',
  ],
  { stdio: 'inherit' },
);
const exitCode = k6.status ?? 1;
if (!existsSync(summaryPath) || k6.error) {
  console.error('k6 did not produce a summary.');
  process.exit(exitCode || 1);
}

const data = JSON.parse(readFileSync(summaryPath, 'utf8'));
const after = await savedCount().catch(() => 'unknown');
const metric = (name, endpoint) =>
  data.metrics[`${name}{endpoint:${endpoint}}`]?.values ?? {};
const ms = (n) => (typeof n === 'number' ? n.toFixed(1) : 'n/a');

let failed = exitCode !== 0;
const rows = ENDPOINTS.map(([key, title]) => {
  const duration = metric('http_req_duration', key);
  const count = metric('http_reqs', key).count ?? 0;
  const sent = metric('bench_sent_at', key);
  const seconds = (sent.max - sent.min) / 1000;
  const errors = metric('http_req_failed', key).rate ?? 1;
  if (!(errors < MAX_ERROR_RATE)) failed = true;
  const rps = seconds > 0 ? (count / seconds).toFixed(1) : 'n/a';
  return `| ${title} | ${count} | ${rps} | ${ms(duration.med)} | ${ms(duration['p(95)'])} | ${ms(duration['p(99)'])} | ${(errors * 100).toFixed(2)}% |`;
});

const git = (...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const dirty = git('status', '--porcelain') ? ' (uncommitted changes)' : '';
const cpus = os.cpus();
const date = new Date();
const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const md = `# Benchmark: ${label}

Result: **${failed ? 'FAILED (error rate above 1% or k6 exited with an error)' : 'passed'}**

## Run

- Date: ${date.toISOString()}
- Commit: ${git('rev-parse', '--short', 'HEAD')}${dirty}
- Machine: ${cpus[0].model}, ${cpus.length} logical CPUs, ${(os.totalmem() / 2 ** 30).toFixed(0)} GB RAM, ${os.platform()} ${os.arch()}
- k6: ${K6_IMAGE} through Docker; the API runs on the host, outside the container
- Saved order requests before / after the run: ${before} / ${after}

## Load settings

- Read endpoints, one after another: 10 virtual users (VUs), 10 s ramp-up (not counted), then 30 s steady
- POST /order-requests: 10 VUs sharing 2000 requests, each with a fresh Idempotency-Key
- No pauses between requests. The run fails when any error rate is 1% or more

## Results

| Endpoint | Requests | req/s | p50 ms | p95 ms | p99 ms | Error rate |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}
`;

let file = resolve(root, `docs/perf/${day}-${label}.md`);
for (let n = 2; existsSync(file); n++)
  file = resolve(root, `docs/perf/${day}-${label}-${n}.md`);
mkdirSync(resolve(root, 'docs/perf'), { recursive: true });
writeFileSync(file, md);
console.log(`\nWrote ${file}`);
process.exit(failed ? exitCode || 1 : 0);
