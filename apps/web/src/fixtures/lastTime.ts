// TEMPORARY: replaced by the API in the wiring ticket.
// Each customer's last order or pending saved request, as the server will send it.
// "cus_lindqvist" has none, to show the empty state.
import type { LastTime, LastTimeItem } from '@/features/order/lastTime';
import { winesFixture } from './wines';

// Stock is copied from the catalog fixture so both agree.
function item(wineId: string, quantity: number): LastTimeItem {
  const wine = winesFixture.find(({ id }) => id === wineId)!;
  return { wine: { ...wine, discontinued: false }, quantity };
}

const discontinuedItem: LastTimeItem = {
  quantity: 2,
  wine: {
    id: 'wine_99',
    producer: 'Castello Vecchio',
    wineName: 'Vin Santo',
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
