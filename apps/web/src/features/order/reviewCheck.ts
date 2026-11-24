import { orderRequestSchema } from '@vintner/contracts';
import { contractMessage, validateCaller } from './callerValidation';
import type { RequestLine } from './requestLines';
import { describeWine } from './wine';

export type ReviewField = 'customer' | 'name' | 'phone' | 'notes' | 'producer';
export type ReviewTarget = ReviewField | { wineId: string };
export type ReviewIssue = { target: ReviewTarget; message: string };

type DraftToCheck = {
  customerId: string;
  name: string;
  phone: string;
  notes: string;
  lines: RequestLine[];
};

const { notes: notesSchema, lines: linesSchema } = orderRequestSchema.shape;

// Everything that stops "Review and save", in page order. Messages come from the
// contract; the whole schema is not run because fixture ids are not uuids.
export function checkDraft({
  customerId,
  name,
  phone,
  notes,
  lines,
}: DraftToCheck): ReviewIssue[] {
  const caller = validateCaller({ customerId, name, phone });
  const issues: ReviewIssue[] = [];
  for (const field of ['customer', 'name', 'phone'] as const) {
    const message = caller[field];
    if (message) issues.push({ target: field, message });
  }
  if (lines.length === 0) {
    issues.push({
      target: 'producer',
      message: contractMessage(linesSchema, []) ?? 'Add at least one wine.',
    });
  }
  for (const { wine, status, isBlocking } of lines) {
    if (isBlocking) {
      issues.push({
        target: { wineId: wine.id },
        message: `${describeWine(wine)}: ${status.text}`,
      });
    }
  }
  const notesMessage = contractMessage(notesSchema, notes);
  if (notesMessage) issues.push({ target: 'notes', message: notesMessage });
  return issues;
}
