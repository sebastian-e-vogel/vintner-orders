import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { describeAvailability, type AvailabilityLevel } from './availability';
import { formatBottleSize, formatVintage, type Wine } from './wine';

type RecentWinesProps = {
  // Already resolved and ordered newest first.
  wines: Wine[];
  lines: Record<string, string>;
  policy: InventoryPolicy;
  onPick: (wineId: string) => void;
};

const availabilityClass: Record<AvailabilityLevel, string> = {
  calm: 'text-success',
  low: 'text-warning',
  out: 'text-danger',
};

export function RecentWines({
  wines,
  lines,
  policy,
  onPick,
}: RecentWinesProps) {
  return (
    <section
      aria-labelledby="recent-wines-heading"
      className="mt-6 flex max-w-[60rem] flex-col gap-3 rounded-md border border-border bg-surface p-6"
    >
      <h2 id="recent-wines-heading" className="text-lg font-medium">
        Your recent wines
      </h2>
      <p className="text-sm text-muted">
        {wines.length > 0
          ? `The last ${wines.length} different wines you added, for any customer. Newest first.`
          : 'Wines you add to a request will show up here.'}
      </p>
      {wines.length === 0 ? (
        <p>You haven&apos;t added any wines yet.</p>
      ) : (
        <ol className="flex flex-wrap gap-2">
          {wines.map((wine) => {
            const quantityText = lines[wine.id];
            const isInRequest = quantityText !== undefined;
            const isBlocked =
              policy === 'strict' && wine.available === 0 && !isInRequest;
            const availability = describeAvailability(wine.available);
            const name = `${wine.producer} ${wine.wineName} ${formatVintage(wine.vintage)}`;
            const size = formatBottleSize(wine.sizeMl);
            const label = isInRequest
              ? `${name}, ${size}, already in this request`
              : `Enter quantity for ${name}, ${size}, ${availability.text}${
                  isBlocked ? ", can't add under strict policy" : ''
                }`;
            return (
              <li key={wine.id}>
                <button
                  type="button"
                  aria-label={label}
                  disabled={isBlocked}
                  onClick={() => onPick(wine.id)}
                  className={`flex flex-col items-start gap-1 rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-primary-soft disabled:opacity-50 disabled:hover:bg-transparent ${
                    isInRequest ? 'bg-primary-soft' : ''
                  }`}
                >
                  <span className="font-medium">{name}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border px-2 py-0.5">
                      {size}
                    </span>
                    {isInRequest ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground">
                        {quantityText === ''
                          ? 'In request'
                          : `In request · ${quantityText}`}
                      </span>
                    ) : (
                      <span className={availabilityClass[availability.level]}>
                        {availability.text}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
