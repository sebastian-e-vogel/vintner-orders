export type AvailabilityLevel = 'calm' | 'low' | 'out';

export const lowStockBelow = 10;

export function describeAvailability(available: number): {
  text: string;
  level: AvailabilityLevel;
} {
  if (available <= 0) return { text: 'Out of stock', level: 'out' };
  return {
    text: `${available} available`,
    level: available < lowStockBelow ? 'low' : 'calm',
  };
}
