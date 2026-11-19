// TEMPORARY: replaced by the API in the wiring ticket.
// "cus_lindqvist" has no history, to show the empty state.
import type { PastOrder } from '@/features/order/lastTime';

export const orderHistoryFixture: PastOrder[] = [
  {
    id: 'ord_101',
    customerId: 'cus_bellavista',
    repId: 'rep-2',
    date: '2026-10-21T10:15:00.000Z',
    items: [{ wineId: 'wine_07', quantity: 6 }],
  },
  {
    id: 'ord_102',
    customerId: 'cus_bellavista',
    repId: 'rep-1',
    date: '2026-11-10T14:40:00.000Z',
    items: [
      { wineId: 'wine_08', quantity: 12 },
      { wineId: 'wine_09', quantity: 24 },
      { wineId: 'wine_14', quantity: 6 },
      { wineId: 'wine_06', quantity: 3 },
      { wineId: 'wine_99', quantity: 2 },
    ],
  },
  {
    id: 'ord_103',
    customerId: 'cus_harbour',
    repId: 'rep-3',
    date: '2026-11-03T09:05:00.000Z',
    items: [
      { wineId: 'wine_03', quantity: 18 },
      { wineId: 'wine_17', quantity: 4 },
    ],
  },
  {
    id: 'ord_104',
    customerId: 'cus_oakroom',
    repId: 'rep-2',
    date: '2026-11-05T16:30:00.000Z',
    items: [{ wineId: 'wine_18', quantity: 12 }],
  },
];
