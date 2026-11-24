import { parseQuantity } from './quantity';
import type { ReviewSnapshot } from './reviewSnapshot';
import { formatBottleSize, formatVintage } from './wine';

type ReadBackProps = {
  snapshot: ReviewSnapshot;
  // Dimmed while the answer is still unknown.
  isDimmed?: boolean;
};

export function ReadBack({ snapshot, isDimmed = false }: ReadBackProps) {
  const { customerName, contactName, phone, notes, lines } = snapshot;
  const details = [
    ['Customer', customerName],
    ['Caller', contactName],
    ['Phone', phone],
  ];

  return (
    <div
      className={`flex flex-col gap-4 ${isDimmed ? 'opacity-50' : ''}`}
      aria-busy={isDimmed}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md bg-background p-3 text-sm">
        {details.map(([term, value]) => (
          <div key={term} className="col-span-2 grid grid-cols-subgrid">
            <dt className="text-muted">{term}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <ol aria-label="Wines to read back" className="flex flex-col gap-2">
        {lines.map(({ wine, quantityText, status }) => {
          const shortBy =
            status.tone === 'warning'
              ? (parseQuantity(quantityText) ?? 0) - wine.available
              : 0;
          return (
            <li
              key={wine.id}
              className="grid grid-cols-[3rem_1fr_auto] items-center gap-x-3"
            >
              <span className="font-bold">{quantityText}</span>
              <span>
                {wine.producer} {wine.name} {formatVintage(wine.vintage)}{' '}
                <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                  {formatBottleSize(wine.sizeMl)}
                </span>
              </span>
              {shortBy > 0 && (
                <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
                  Short by {shortBy}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="text-sm">
        <span className="text-muted">Note: </span>
        {notes || 'none'}
      </p>
    </div>
  );
}
