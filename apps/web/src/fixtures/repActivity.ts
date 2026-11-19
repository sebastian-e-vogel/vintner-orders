// TEMPORARY: replaced by the API in the wiring ticket.
import type { RepActivityEvent } from '@/features/order/pickRecentWines';

export const currentRepId = 'rep-1';

const event = (
  repId: string,
  wineId: string,
  customerId: string,
  timestamp: string,
): RepActivityEvent => ({ repId, wineId, customerId, timestamp });

// 13 distinct catalog wines for the current rep (so the cap of 10 applies), repeats,
// another rep's events, and wine_unknown, which is not in the catalog.
export const repActivityFixture: RepActivityEvent[] = [
  event('rep-1', 'wine_06', 'cus_harbour', '2026-11-18T15:40:00Z'),
  event('rep-2', 'wine_20', 'cus_oakroom', '2026-11-18T15:10:00Z'),
  event('rep-1', 'wine_01', 'cus_harbour', '2026-11-18T14:55:00Z'),
  event('rep-1', 'wine_unknown', 'cus_harbour', '2026-11-18T14:30:00Z'),
  event('rep-1', 'wine_06', 'cus_oakroom', '2026-11-18T11:20:00Z'),
  event('rep-1', 'wine_03', 'cus_oakroom', '2026-11-17T16:05:00Z'),
  event('rep-1', 'wine_02', 'cus_bellavista', '2026-11-17T15:45:00Z'),
  event('rep-2', 'wine_09', 'cus_bellavista', '2026-11-17T12:00:00Z'),
  event('rep-1', 'wine_07', 'cus_bellavista', '2026-11-16T10:30:00Z'),
  event('rep-1', 'wine_01', 'cus_oakroom', '2026-11-16T09:15:00Z'),
  event('rep-1', 'wine_10', 'cus_harbour', '2026-11-13T16:40:00Z'),
  event('rep-1', 'wine_12', 'cus_harbour', '2026-11-13T14:20:00Z'),
  event('rep-1', 'wine_14', 'cus_oakroom', '2026-11-12T11:00:00Z'),
  event('rep-1', 'wine_17', 'cus_oakroom', '2026-11-11T15:30:00Z'),
  event('rep-1', 'wine_18', 'cus_bellavista', '2026-11-10T10:10:00Z'),
  event('rep-1', 'wine_19', 'cus_bellavista', '2026-11-09T13:45:00Z'),
  event('rep-1', 'wine_05', 'cus_harbour', '2026-11-06T09:00:00Z'),
  event('rep-1', 'wine_08', 'cus_harbour', '2026-11-05T09:00:00Z'),
];
