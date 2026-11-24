import type { OrderRequestInput } from '@vintner/contracts';
import type { RequestLine } from './requestLines';

// What the dialog reads back and sends. Taken when the review opens, so it stays
// the same after a successful save clears the draft.
export type ReviewSnapshot = {
  customerName: string;
  contactName: string;
  phone: string;
  notes: string;
  lines: RequestLine[];
  input: OrderRequestInput;
};

type DraftToReview = {
  customerId: string;
  customerName: string;
  name: string;
  phone: string;
  notes: string;
  lines: RequestLine[];
};

export function buildReviewSnapshot({
  customerId,
  customerName,
  name,
  phone,
  notes,
  lines,
}: DraftToReview): ReviewSnapshot {
  return {
    customerName,
    contactName: name.trim(),
    phone: phone.trim(),
    notes: notes.trim(),
    lines,
    input: {
      customerId,
      contactName: name,
      phone,
      notes,
      lines: lines.map(({ wine, quantityText }) => ({
        wineId: wine.id,
        quantity: Number(quantityText),
      })),
    },
  };
}
