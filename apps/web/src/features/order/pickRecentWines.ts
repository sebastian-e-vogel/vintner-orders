import type { Wine } from './wine';

export type RepActivityEvent = {
  repId: string;
  wineId: string;
  customerId: string;
  // ISO 8601 string.
  timestamp: string;
};

export const recentWinesLimit = 10;

export function pickRecentWines(
  events: RepActivityEvent[],
  repId: string,
  wines: Wine[],
  limit = recentWinesLimit,
): Wine[] {
  const byId = new Map(wines.map((wine) => [wine.id, wine]));
  const seen = new Set<string>();
  const result: Wine[] = [];
  const newestFirst = events
    .filter((event) => event.repId === repId)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  for (const { wineId } of newestFirst) {
    const wine = byId.get(wineId);
    if (!wine || seen.has(wineId)) continue;
    seen.add(wineId);
    result.push(wine);
    if (result.length === limit) break;
  }
  return result;
}
