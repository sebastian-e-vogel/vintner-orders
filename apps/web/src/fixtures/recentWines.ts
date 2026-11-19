// TEMPORARY: replaced by GET /recent-wines in the wiring ticket.
import type { Wine } from '@/features/order/wine';
import { winesFixture } from './wines';

// Shaped like the API response: up to 10 distinct wines, newest first.
// wine_06 is out of stock, to show the strict-policy block.
const recentWineIds = [
  'wine_06',
  'wine_01',
  'wine_03',
  'wine_02',
  'wine_07',
  'wine_10',
  'wine_12',
  'wine_14',
  'wine_18',
  'wine_19',
];

export const recentWinesFixture: Wine[] = recentWineIds.map((id) =>
  winesFixture.find((wine) => wine.id === id)!,
);
