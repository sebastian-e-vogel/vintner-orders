// TEMPORARY: replaced by the API in the wiring ticket.
// Not derived from savedRequests.ts: that fixture names customers by company text and its
// lines have no wine ids, so it cannot be matched to the customer list or the catalog.
import type { PendingRequest } from '@/features/order/lastTime';

export const pendingRequestsFixture: PendingRequest[] = [
  {
    id: 'REQ-2001',
    customerId: 'cus_harbour',
    contactName: 'Priya Nair',
    date: '2026-11-17T11:20:00.000Z',
    items: [
      { wineId: 'wine_10', quantity: 12 },
      { wineId: 'wine_13', quantity: 6 },
    ],
  },
  {
    id: 'REQ-2002',
    customerId: 'cus_oakroom',
    contactName: 'Hannah Clarke',
    date: '2026-11-01T09:00:00.000Z',
    items: [{ wineId: 'wine_04', quantity: 6 }],
  },
];
