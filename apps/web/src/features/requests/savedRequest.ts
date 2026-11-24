export type SavedRequestLine = {
  id: string;
  producer: string;
  wine: string;
  region: string;
  vintage: number | null;
  size: string;
  requested: number;
  availableAtSave: number;
  shortBy: number;
};

export type SavedRequest = {
  id: string;
  savedAt: string;
  customer: string;
  usualContact: string;
  contactName: string;
  phone: string;
  salesRepName: string;
  policy: 'strict' | 'flexible';
  note?: string;
  lines: SavedRequestLine[];
};

export function countShortLines(request: SavedRequest): number {
  return request.lines.filter((line) => line.shortBy > 0).length;
}

export function totalBottles(request: SavedRequest): number {
  return request.lines.reduce((sum, line) => sum + line.requested, 0);
}

export function pluralize(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
