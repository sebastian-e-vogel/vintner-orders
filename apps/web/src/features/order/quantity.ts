export const maxQuantity = 999;

// Keeps digits only and drops leading zeros while the rep types.
export function sanitizeQuantity(text: string): string {
  return text.replace(/\D/g, '').replace(/^0+/, '');
}

export function parseQuantity(text: string): number | null {
  if (!/^\d+$/.test(text)) return null;
  const quantity = Number(text);
  return quantity >= 1 && quantity <= maxQuantity ? quantity : null;
}
