export function formatBottleSize(sizeMl: number): string {
  return sizeMl >= 1000 ? `${sizeMl / 1000} L` : `${sizeMl} ml`;
}
