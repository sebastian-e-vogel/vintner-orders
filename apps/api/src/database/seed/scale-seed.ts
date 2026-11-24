import { createHash } from 'node:crypto';
import { DataSource, type EntityManager } from 'typeorm';
import { CURRENT_SALES_REP_ID } from '../../sales-reps/current-sales-rep.js';
import type { DatabaseEnv } from '../database.env.js';
import { appTables } from './seed.js';

export const SCALE_SIZES = {
  wines: 20_000,
  customers: 5_000,
  salesReps: 50,
  orders: 500_000,
  requests: 20_000,
};
export type ScaleSizes = typeof SCALE_SIZES;

export const SCALE_SEED = 20260101;
export const DEFAULT_PERF_DB = 'vintner_perf';

const CURRENT_REP_SHARE = 0.25;
const FIRST_DATE = Date.UTC(2023, 0, 1);
const LAST_DATE = Date.UTC(2026, 5, 30);
// Weights for 1..8 items per order (mean 4).
const ITEMS_PER_ORDER = [6, 12, 22, 25, 17, 10, 5, 3];
const MAX_PARAMS = 60_000; // Postgres allows 65535 per statement.
const BATCH = 5_000;

type Rng = () => number;

// mulberry32: small seeded generator, same sequence for the same seed.
function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (rng: Rng, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));
const pick = <T>(rng: Rng, list: readonly T[]) =>
  list[int(rng, 0, list.length - 1)];

// UUID v4 from the PRNG, random-looking like gen_random_uuid(). A collision fails on the primary key.
function uuid(rng: Rng): string {
  const bytes = Array.from({ length: 16 }, () => int(rng, 0, 255));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Zipf-like picker: a few items get most of the picks. Popularity is shuffled against index order.
function zipfPicker(n: number, exponent: number, rng: Rng): () => number {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = int(rng, 0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const cumulative = new Float64Array(n);
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += 1 / (i + 1) ** exponent;
    cumulative[i] = total;
  }
  return () => {
    const target = rng() * total;
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return order[lo];
  };
}

// Rep 0 is the current rep with a fixed share; the others follow a Zipf curve.
function repPicker(n: number, rng: Rng): () => number {
  if (n === 1) return () => 0;
  const others = zipfPicker(n - 1, 0.8, rng);
  return () => (rng() < CURRENT_REP_SHARE ? 0 : 1 + others());
}

function distinctPicks(count: number, next: () => number): number[] {
  const picked = new Set<number>();
  while (picked.size < count) picked.add(next());
  return [...picked];
}

const wineWords = [
  'Rosso',
  'Bianco',
  'Riserva',
  'Cuvée',
  'Brut',
  'Syrah',
  'Riesling',
  'Pinot',
  'Tempranillo',
  'Malbec',
  'Rosé',
  'Chardonnay',
];
const wineSuffixes = [
  'del Colle',
  'Antica',
  'de Brume',
  'Reserva',
  'Noir',
  'Blanc',
  'Fjell',
  'Calanque',
  'Grande',
  'Vieille Vigne',
];
const producerFirst = [
  'Cantina',
  'Tenuta',
  'Domaine',
  'Maison',
  'Bodega',
  'Weingut',
  'Château',
  'Harrowfield',
];
const producerLast = [
  'Monteverde',
  'Valdoro',
  'Saint-Orelle',
  'Verdelle',
  'Fjordhaug',
  'Alderwood',
  'Bellavista',
  'Roccanera',
  'Dunmore',
  'Altamira',
];
const regions = [
  'Montepulciano',
  'Chianti Classico',
  'Hardanger',
  'Cassis',
  'Barossa Valley',
  'Champagne',
  'Loire Valley',
  'Rioja',
  'Mosel',
  'Mendoza',
  'Douro',
  'Marlborough',
];
const sizesMl = [375, 500, 750, 750, 750, 750, 1500, 3000];
const firstNames = [
  'Giulia',
  'Henrik',
  'Camille',
  'Oliver',
  'Marta',
  'Lucas',
  'Elena',
  'Tomas',
  'Ingrid',
  'Pablo',
  'Sofia',
  'Jonas',
];
const lastNames = [
  'Ferrante',
  'Dahl',
  'Roux',
  'Grant',
  'Lindqvist',
  'Moreau',
  'Santos',
  'Weber',
  'Holm',
  'Costa',
  'Novak',
  'Keller',
];
const businessKinds = [
  'Taverna',
  'Bistro',
  'Cave',
  'Wine Bar',
  'Enoteca',
  'Gastropub',
  'Bottle Shop',
];
const businessNames = [
  'Alba',
  'Nordlys',
  'du Port',
  'Gilded Cork',
  'Bellini',
  'Harbour',
  'Olivera',
  'Rivage',
  'Stenhus',
  'Lumen',
];
const notes = [
  '',
  '',
  '',
  'Call before delivery',
  'Deliver before noon',
  'Customer asked for a discount',
  'Repeat order',
];

const fullName = (rng: Rng) =>
  `${pick(rng, firstNames)} ${pick(rng, lastNames)}`;

async function insertRows(
  manager: EntityManager,
  table: string,
  columns: string[],
  rows: unknown[][],
) {
  const perChunk = Math.floor(MAX_PARAMS / columns.length);
  for (let start = 0; start < rows.length; start += perChunk) {
    const chunk = rows.slice(start, start + perChunk);
    const values = chunk
      .map(
        (_, r) =>
          `(${columns.map((_, c) => `$${r * columns.length + c + 1}`).join(',')})`,
      )
      .join(',');
    await manager.query(
      `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(',')}) VALUES ${values}`,
      chunk.flat(),
    );
  }
}

function refuseInProduction() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed: NODE_ENV is production.');
  }
}

// Creates the perf database if missing. Never touches the dev database.
export async function createPerfDatabaseIfMissing(
  env: DatabaseEnv,
  name: string,
) {
  refuseInProduction();
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid perf database name "${name}".`);
  }
  if (name === env.POSTGRES_DB) {
    throw new Error(
      `Refusing to seed: the perf database must not be the dev database "${name}".`,
    );
  }
  // The maintenance database, so the perf database can be created from scratch.
  const admin = new DataSource({
    type: 'postgres',
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: 'postgres',
  });
  await admin.initialize();
  try {
    const found = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [name],
    );
    if (found.length === 0) await admin.query(`CREATE DATABASE "${name}"`);
  } finally {
    await admin.destroy();
  }
}

export async function seedScale(
  dataSource: DataSource,
  {
    sizes = SCALE_SIZES,
    seed = SCALE_SEED,
  }: { sizes?: ScaleSizes; seed?: number } = {},
) {
  refuseInProduction();
  // One stream per kind, so changing one size does not shift the other tables.
  const rngFor = (kind: number) => createRng(seed + kind * 1_000_003);

  const repRng = rngFor(1);
  const reps = Array.from({ length: sizes.salesReps }, (_, i) => ({
    id: i === 0 ? CURRENT_SALES_REP_ID : uuid(repRng),
    name: i === 0 ? 'Marta Lindqvist' : fullName(repRng),
    email:
      i === 0 ? 'marta.lindqvist@vintner.example' : `rep-${i}@perf.example`,
  }));

  const customerRng = rngFor(2);
  const customers = Array.from({ length: sizes.customers }, (_, i) => ({
    id: uuid(customerRng),
    name: `${pick(customerRng, businessKinds)} ${pick(customerRng, businessNames)} ${i + 1}`,
    contactName: fullName(customerRng),
    email: `customer-${i + 1}@perf.example`,
    phone: `+00 555 ${String(int(customerRng, 0, 9_999_999)).padStart(7, '0')}`,
  }));

  const wineRng = rngFor(3);
  const wines = Array.from({ length: sizes.wines }, (_, i) => ({
    id: uuid(wineRng),
    name: `${pick(wineRng, wineWords)} ${pick(wineRng, wineSuffixes)}`,
    producer: `${pick(wineRng, producerFirst)} ${pick(wineRng, producerLast)}`,
    vintage: wineRng() < 0.1 ? null : int(wineRng, 2005, 2024),
    region: pick(wineRng, regions),
    sizeMl: pick(wineRng, sizesMl),
    sku: `PERF-${String(i + 1).padStart(5, '0')}`,
    available: wineRng() < 0.08 ? 0 : int(wineRng, 1, 500),
  }));

  const dateRng = rngFor(4);
  // sqrt skews dates toward the recent end of the window.
  const randomDate = () =>
    new Date(
      FIRST_DATE + (LAST_DATE - FIRST_DATE) * Math.sqrt(dateRng()),
    ).toISOString();
  const quantity = (rng: Rng) =>
    rng() < 0.5 ? int(rng, 1, 6) : 6 * int(rng, 1, 8);

  await dataSource.transaction(async (manager) => {
    await manager.query(
      `TRUNCATE ${appTables.map((t) => `"${t}"`).join(', ')}`,
    );
    await insertRows(
      manager,
      'sales_rep',
      ['id', 'name', 'email'],
      reps.map((r) => [r.id, r.name, r.email]),
    );
    await insertRows(
      manager,
      'customer',
      ['id', 'name', 'contact_name', 'email', 'phone'],
      customers.map((c) => [c.id, c.name, c.contactName, c.email, c.phone]),
    );
    await insertRows(
      manager,
      'wine',
      [
        'id',
        'name',
        'producer',
        'vintage',
        'region',
        'size_ml',
        'sku',
        'available',
      ],
      wines.map((w) => [
        w.id,
        w.name,
        w.producer,
        w.vintage,
        w.region,
        w.sizeMl,
        w.sku,
        w.available,
      ]),
    );

    // Orders and items are generated and flushed in batches to keep memory flat.
    const orderRng = rngFor(5);
    const pickCustomer = zipfPicker(sizes.customers, 0.9, orderRng);
    const pickRep = repPicker(sizes.salesReps, orderRng);
    const pickWine = zipfPicker(sizes.wines, 1.1, orderRng);
    const itemCounts = ITEMS_PER_ORDER.flatMap((w, i) =>
      Array<number>(w).fill(i + 1),
    );
    let orderRows: unknown[][] = [];
    let itemRows: unknown[][] = [];
    const flushOrders = async () => {
      await insertRows(
        manager,
        'historical_order',
        ['id', 'customer_id', 'sales_rep_id', 'ordered_at'],
        orderRows,
      );
      await insertRows(
        manager,
        'historical_order_item',
        ['id', 'order_id', 'wine_id', 'quantity'],
        itemRows,
      );
      orderRows = [];
      itemRows = [];
    };
    for (let i = 0; i < sizes.orders; i++) {
      const orderId = uuid(orderRng);
      orderRows.push([
        orderId,
        customers[pickCustomer()].id,
        reps[pickRep()].id,
        randomDate(),
      ]);
      const count = Math.min(pick(orderRng, itemCounts), sizes.wines);
      for (const w of distinctPicks(count, pickWine)) {
        itemRows.push([
          uuid(orderRng),
          orderId,
          wines[w].id,
          quantity(orderRng),
        ]);
      }
      if (orderRows.length === BATCH) await flushOrders();
    }
    if (orderRows.length > 0) await flushOrders();

    const requestRng = rngFor(6);
    const pickRequestCustomer = zipfPicker(sizes.customers, 0.9, requestRng);
    const pickRequestRep = repPicker(sizes.salesReps, requestRng);
    const pickRequestWine = zipfPicker(sizes.wines, 1.1, requestRng);
    let requestRows: unknown[][] = [];
    let requestItemRows: unknown[][] = [];
    const flushRequests = async () => {
      await insertRows(
        manager,
        'order_request',
        [
          'id',
          'idempotency_key',
          'request_hash',
          'customer_id',
          'sales_rep_id',
          'contact_name',
          'phone',
          'notes',
          'inventory_policy',
          'created_at',
        ],
        requestRows,
      );
      await insertRows(
        manager,
        'order_request_item',
        ['id', 'request_id', 'wine_id', 'quantity', 'available_at_save'],
        requestItemRows,
      );
      requestRows = [];
      requestItemRows = [];
    };
    for (let i = 0; i < sizes.requests; i++) {
      const requestId = uuid(requestRng);
      const customer = customers[pickRequestCustomer()];
      const repId = reps[pickRequestRep()].id;
      const picked = distinctPicks(
        Math.min(int(requestRng, 1, 6), sizes.wines),
        pickRequestWine,
      ).map((w) => wines[w]);
      // Strict only when every wine has stock, so strict requests never exceed availability.
      const strict = requestRng() < 0.7 && picked.every((w) => w.available > 0);
      const lines = picked.map((wine) => ({
        wineId: wine.id,
        available: wine.available,
        quantity: strict
          ? int(requestRng, 1, Math.min(wine.available, 12))
          : int(requestRng, 1, 12),
      }));
      const policy = strict ? 'strict' : 'flexible';
      const hash = createHash('sha256')
        .update(
          JSON.stringify({
            customerId: customer.id,
            salesRepId: repId,
            inventoryPolicy: policy,
            items: lines
              .map((l) => [l.wineId, l.quantity] as const)
              .sort(([a], [b]) => a.localeCompare(b)),
          }),
        )
        .digest('hex');
      requestRows.push([
        requestId,
        uuid(requestRng),
        hash,
        customer.id,
        repId,
        customer.contactName,
        customer.phone,
        pick(requestRng, notes),
        policy,
        randomDate(),
      ]);
      for (const line of lines) {
        requestItemRows.push([
          uuid(requestRng),
          requestId,
          line.wineId,
          line.quantity,
          line.available,
        ]);
      }
      if (requestRows.length === BATCH) await flushRequests();
    }
    if (requestRows.length > 0) await flushRequests();

    await manager.query(
      `INSERT INTO "settings" ("inventory_policy") VALUES ('strict')`,
    );
  });
}

export async function countRows(dataSource: DataSource) {
  const counts: Record<string, number> = {};
  for (const table of appTables) {
    const [row] = await dataSource.query<{ n: number }[]>(
      `SELECT count(*)::int AS n FROM "${table}"`,
    );
    counts[table] = row.n;
  }
  return counts;
}
