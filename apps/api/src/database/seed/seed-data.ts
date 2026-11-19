// Fixed ids and dates: every seed run produces exactly this data.
const id = (kind: string, n: number) =>
  `${kind}000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const salesRep = {
  id: id('a1', 1),
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

// [name, producer, vintage, format, available]
const wineRows: [string, string, number | null, string, number][] = [
  ['Rosso del Colle', 'Cantina Monteverde', 2021, '750 ml', 240],
  ['Rosso del Colle', 'Cantina Monteverde', 2022, '750 ml', 180],
  ['Rosso del Colle', 'Cantina Monteverde', 2021, '1.5 L', 12],
  ['Bianco di Rocca', 'Cantina Monteverde', 2023, '750 ml', 96],
  ['Riserva Antica', 'Tenuta Valdoro', 2018, '750 ml', 24],
  ['Riserva Antica', 'Tenuta Valdoro', 2019, '750 ml', 0],
  ['Pinot Gris Fjell', 'Fjordhaug Vinhus', 2023, '750 ml', 130],
  ['Riesling Tidvann', 'Fjordhaug Vinhus', 2022, '750 ml', 7],
  ['Riesling Tidvann', 'Fjordhaug Vinhus', 2022, '375 ml', 60],
  ['Cuvée des Falaises', 'Domaine Saint-Orelle', 2020, '750 ml', 48],
  ['Cuvée des Falaises', 'Domaine Saint-Orelle', 2020, '1.5 L', 6],
  ['Rosé Calanque', 'Domaine Saint-Orelle', 2024, '750 ml', 320],
  ['Blanc de Brume', 'Domaine Saint-Orelle', 2023, '750 ml', 0],
  ['Old Vine Syrah', 'Harrowfield Estate', 2019, '750 ml', 35],
  ['Chalk Hill Chardonnay', 'Harrowfield Estate', 2022, '750 ml', 72],
  ['Brut Réserve', 'Maison Verdelle', null, '750 ml', 150],
  ['Brut Réserve', 'Maison Verdelle', null, '1.5 L', 3],
  ['Vin Doux du Soir', 'Maison Verdelle', 2017, '500 ml', 0],
];

export const wines = wineRows.map(
  ([name, producer, vintage, format, available], i) => ({
    id: id('b1', i + 1),
    name,
    producer,
    vintage,
    format,
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
