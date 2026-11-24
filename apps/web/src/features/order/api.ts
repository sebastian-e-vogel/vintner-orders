import 'server-only';

import { customerListSchema, wineListSchema } from '@vintner/contracts';
import { apiFetch } from '@/lib/api';

export function getCustomers() {
  return apiFetch('/customers', customerListSchema);
}

export function getWines() {
  return apiFetch('/wines', wineListSchema);
}

// Most recent first.
export function getRecentWines() {
  return apiFetch('/recent-wines', wineListSchema);
}
