export type SavedRequestLine = {
  id: string;
  producer: string;
  wine: string;
  region: string;
  vintage: number;
  size: string;
  requested: number;
  availableAtSave: number;
};

export type SavedRequest = {
  reference: string;
  savedAt: string;
  customer: string;
  usualContact: string;
  contactName: string;
  phone: string;
  repId: string;
  policy: 'strict' | 'flexible';
  note?: string;
  lines: SavedRequestLine[];
};

export function shortBy(line: SavedRequestLine): number {
  return Math.max(0, line.requested - line.availableAtSave);
}

export function countShortLines(request: SavedRequest): number {
  return request.lines.filter((line) => shortBy(line) > 0).length;
}

export function totalBottles(request: SavedRequest): number {
  return request.lines.reduce((sum, line) => sum + line.requested, 0);
}

export function newestFirst(requests: SavedRequest[]): SavedRequest[] {
  return [...requests].sort(
    (a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt),
  );
}

export function pluralize(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
