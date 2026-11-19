// Display zone for every displayed timestamp, until a per-user zone exists.
export const DISPLAY_TIME_ZONE = 'UTC';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: DISPLAY_TIME_ZONE,
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const timeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: DISPLAY_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

// Newer ICU versions put a narrow no-break space before AM/PM.
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso)).replace(/\s/g, ' ');
}

export function formatDateTime(iso: string): string {
  return `${dateFormat.format(new Date(iso))}, ${formatTime(iso)}`;
}
