import { describe, expect, it } from 'vitest';
import { formatDateTime, formatTime } from './formatTimestamp';

describe('formatTimestamp', () => {
  it('formats the time as h:mm AM/PM in the display zone', () => {
    expect(formatTime('2026-11-18T15:05:00.000Z')).toBe('3:05 PM');
    expect(formatTime('2026-11-18T00:07:00.000Z')).toBe('12:07 AM');
  });

  it('formats weekday, date and time', () => {
    expect(formatDateTime('2026-11-02T14:30:00.000Z')).toBe(
      'Monday, November 2, 2026, 2:30 PM',
    );
  });
});
