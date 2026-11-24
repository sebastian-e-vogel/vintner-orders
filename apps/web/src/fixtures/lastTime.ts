// TEMPORARY: replaced by the API in the wiring ticket.
// Each customer's last order or pending saved request, as the server will send it.
// "cus_lindqvist" has none, to show the empty state.
import type {
  LastTime,
  LastTimeItem,
  LastTimeWine,
} from '@/features/order/lastTime';

type CatalogWine = Omit<LastTimeWine, 'discontinued'>;

// Wines are inlined until the last-time ticket reads them from the API.
const wines: Record<string, CatalogWine> = {
  wine_06: {
    id: 'wine_06',
    producer: 'Domaine Aubrey',
    name: 'Pinot Noir Reserve',
    region: 'Oregon',
    vintage: 2022,
    sizeMl: 1500,
    available: 0,
  },
  wine_08: {
    id: 'wine_08',
    producer: 'Bellerive',
    name: 'Brunello di Montalcino',
    region: 'Tuscany',
    vintage: 2020,
    sizeMl: 750,
    available: 30,
  },
  wine_09: {
    id: 'wine_09',
    producer: 'Bellerive',
    name: 'Rosato',
    region: 'Tuscany',
    vintage: 2023,
    sizeMl: 750,
    available: 72,
  },
  wine_10: {
    id: 'wine_10',
    producer: 'Casa Marolo',
    name: 'Malbec Gran Reserva',
    region: 'Mendoza',
    vintage: 2020,
    sizeMl: 750,
    available: 60,
  },
  wine_13: {
    id: 'wine_13',
    producer: 'Holtz Estate',
    name: 'Riesling Kabinett',
    region: 'Mosel',
    vintage: 2022,
    sizeMl: 750,
    available: 84,
  },
  wine_14: {
    id: 'wine_14',
    producer: 'Holtz Estate',
    name: 'Riesling Kabinett',
    region: 'Mosel',
    vintage: 2023,
    sizeMl: 750,
    available: 5,
  },
  wine_18: {
    id: 'wine_18',
    producer: 'Riverstone',
    name: 'Cabernet Sauvignon',
    region: 'Napa Valley',
    vintage: 2019,
    sizeMl: 750,
    available: 96,
  },
};

function item(wineId: string, quantity: number): LastTimeItem {
  return { wine: { ...wines[wineId], discontinued: false }, quantity };
}

const discontinuedItem: LastTimeItem = {
  quantity: 2,
  wine: {
    id: 'wine_99',
    producer: 'Castello Vecchio',
    name: 'Vin Santo',
    region: 'Tuscany',
    vintage: 2012,
    sizeMl: 375,
    available: 0,
    discontinued: true,
  },
};

export const lastTimeFixture: Record<string, LastTime> = {
  cus_bellavista: {
    kind: 'order',
    date: '2026-11-10T14:40:00.000Z',
    repName: 'Sofia Alvarez',
    items: [
      item('wine_08', 12),
      item('wine_09', 24),
      item('wine_14', 6),
      item('wine_06', 3),
      discontinuedItem,
    ],
  },
  cus_harbour: {
    kind: 'request',
    date: '2026-11-17T11:20:00.000Z',
    contactName: 'Priya Nair',
    items: [item('wine_10', 12), item('wine_13', 6)],
  },
  cus_oakroom: {
    kind: 'order',
    date: '2026-11-05T16:30:00.000Z',
    repName: 'Tom Bennett',
    items: [item('wine_18', 12)],
  },
};
