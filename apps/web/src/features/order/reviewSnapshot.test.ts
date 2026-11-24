import { expect, it } from 'vitest';
import { buildRequestLines } from './requestLines';
import { buildReviewSnapshot } from './reviewSnapshot';
import { winesFixture } from '@/fixtures/wines';

it('builds the input from the draft and trimmed values for the read-back', () => {
  const [first, second] = winesFixture;
  const snapshot = buildReviewSnapshot({
    customerId: 'cus_a',
    customerName: 'Bellavista',
    name: ' Ana ',
    phone: ' 1234567 ',
    notes: ' Deliver early ',
    lines: buildRequestLines(
      winesFixture,
      { [first.id]: '3', [second.id]: '12' },
      'flexible',
    ),
  });
  expect(snapshot.input).toEqual({
    customerId: 'cus_a',
    contactName: ' Ana ',
    phone: ' 1234567 ',
    notes: ' Deliver early ',
    lines: [
      { wineId: first.id, quantity: 3 },
      { wineId: second.id, quantity: 12 },
    ],
  });
  expect(snapshot).toMatchObject({
    contactName: 'Ana',
    phone: '1234567',
    notes: 'Deliver early',
  });
});
