import { CURRENT_SALES_REP_ID } from '../../sales-reps/current-sales-rep.js';

// Fixed ids and dates: every seed run produces exactly this data.
const id = (kind: string, n: number) =>
  `${kind}000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const salesRep = {
  id: CURRENT_SALES_REP_ID,
  name: 'Marta Lindqvist',
  email: 'marta.lindqvist@vintner.example',
};

export const customers = [
  [
    'Taverna Alba',
    'Giulia Ferrante',
    'giulia@taverna-alba.example',
    '+39 055 555 0101',
  ],
  [
    'Bistro Nordlys',
    'Henrik Dahl',
    'henrik@bistro-nordlys.example',
    '+47 22 55 01 02',
  ],
  [
    'Cave du Port',
    'Camille Roux',
    'camille@cave-du-port.example',
    '+33 4 91 55 01 03',
  ],
  [
    'The Gilded Cork',
    'Oliver Grant',
    'oliver@gilded-cork.example',
    '+44 20 7946 0104',
  ],
].map(([name, contactName, email, phone], i) => ({
  id: id('c1', i + 1),
  name,
  contactName,
  email,
  phone,
}));

// [name, producer, region, vintage, sizeMl, available]
const wineRows: [string, string, string, number | null, number, number][] = [
  ['Rosso del Colle', 'Cantina Monteverde', 'Montepulciano', 2021, 750, 240],
  ['Rosso del Colle', 'Cantina Monteverde', 'Montepulciano', 2022, 750, 180],
  ['Rosso del Colle', 'Cantina Monteverde', 'Montepulciano', 2021, 1500, 12],
  ['Bianco di Rocca', 'Cantina Monteverde', 'Montepulciano', 2023, 750, 96],
  ['Riserva Antica', 'Tenuta Valdoro', 'Chianti Classico', 2018, 750, 24],
  ['Riserva Antica', 'Tenuta Valdoro', 'Chianti Classico', 2019, 750, 0],
  ['Pinot Gris Fjell', 'Fjordhaug Vinhus', 'Hardanger', 2023, 750, 130],
  ['Riesling Tidvann', 'Fjordhaug Vinhus', 'Hardanger', 2022, 750, 7],
  ['Riesling Tidvann', 'Fjordhaug Vinhus', 'Hardanger', 2022, 375, 60],
  ['Cuvée des Falaises', 'Domaine Saint-Orelle', 'Cassis', 2020, 750, 48],
  ['Cuvée des Falaises', 'Domaine Saint-Orelle', 'Cassis', 2020, 1500, 6],
  ['Rosé Calanque', 'Domaine Saint-Orelle', 'Cassis', 2024, 750, 320],
  ['Blanc de Brume', 'Domaine Saint-Orelle', 'Cassis', 2023, 750, 0],
  ['Old Vine Syrah', 'Harrowfield Estate', 'Barossa Valley', 2019, 750, 35],
  [
    'Chalk Hill Chardonnay',
    'Harrowfield Estate',
    'Barossa Valley',
    2022,
    750,
    72,
  ],
  ['Brut Réserve', 'Maison Verdelle', 'Champagne', null, 750, 150],
  ['Brut Réserve', 'Maison Verdelle', 'Champagne', null, 1500, 3],
  ['Vin Doux du Soir', 'Maison Verdelle', 'Loire Valley', 2017, 500, 0],
];

export const wines = wineRows.map(
  ([name, producer, region, vintage, sizeMl, available], i) => ({
    id: id('b1', i + 1),
    name,
    producer,
    region,
    vintage,
    sizeMl,
    sku: `SEED-${String(i + 1).padStart(3, '0')}`,
    available,
  }),
);

// [customer index, ordered at, [wine index, quantity][]]
const orderRows: [number, string, [number, number][]][] = [
  [
    0,
    '2026-01-12T10:15:00Z',
    [
      [0, 24],
      [3, 12],
    ],
  ],
  [0, '2026-03-02T14:30:00Z', [[4, 6]]],
  [
    1,
    '2026-03-20T09:00:00Z',
    [
      [6, 24],
      [7, 12],
      [8, 12],
    ],
  ],
  [
    1,
    '2026-06-08T11:45:00Z',
    [
      [0, 12],
      [6, 12],
      [14, 6],
      [15, 24],
    ],
  ],
  [
    2,
    '2026-08-25T16:20:00Z',
    [
      [9, 12],
      [11, 36],
    ],
  ],
  [
    3,
    '2026-10-05T13:10:00Z',
    [
      [13, 6],
      [14, 12],
      [15, 12],
    ],
  ],
];

export const orders = orderRows.map(([customer, orderedAt, lines], i) => ({
  id: id('d1', i + 1),
  customerId: customers[customer].id,
  salesRepId: salesRep.id,
  orderedAt: new Date(orderedAt),
  items: lines.map(([wine, quantity], j) => ({
    id: id('e1', (i + 1) * 10 + j + 1),
    wineId: wines[wine].id,
    quantity,
  })),
}));
