import Link from 'next/link';
import { PolicyBadge } from '@/components/PolicyBadge';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { summarizeRequest, type RequestLine } from './requestLines';
import { lineToneClass, statusClass } from './WineRow';
import { describeWine, formatBottleSize, formatVintage } from './wine';

type RequestPanelProps = {
  // undefined means no customer is chosen yet.
  customerName?: string;
  lines: RequestLine[];
  policy: InventoryPolicy;
  onGoTo: (wineId: string) => void;
  onRemove: (wineId: string) => void;
};

const policyLabel: Record<InventoryPolicy, string> = {
  strict: 'Strict policy',
  flexible: 'Flexible policy',
};

function Summary({
  lines,
  policy,
}: Pick<RequestPanelProps, 'lines' | 'policy'>) {
  const { wineCount, bottleCount, toFixCount, shortCount } =
    summarizeRequest(lines);
  const isAllWithinStock =
    wineCount > 0 && toFixCount === 0 && shortCount === 0;

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm">
      <p>
        <strong>{wineCount}</strong> {wineCount === 1 ? 'wine' : 'wines'} ·{' '}
        <strong>{bottleCount}</strong>{' '}
        {bottleCount === 1 ? 'bottle' : 'bottles'}
      </p>
      {toFixCount > 0 && (
        <span className="rounded-full bg-danger-soft px-2 py-0.5 font-medium text-danger">
          {toFixCount} to fix before saving
        </span>
      )}
      {shortCount > 0 && (
        <span className="rounded-full bg-warning-soft px-2 py-0.5 font-medium text-warning">
          {shortCount} short — will be flagged
        </span>
      )}
      {isAllWithinStock && (
        <span className="rounded-full bg-success-soft px-2 py-0.5 font-medium text-success">
          All within stock
        </span>
      )}
      <Link
        href="/settings"
        className="ml-auto rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <PolicyBadge policy={policy}>{policyLabel[policy]}</PolicyBadge>
      </Link>
    </div>
  );
}

export function RequestPanel({
  customerName,
  lines,
  policy,
  onGoTo,
  onRemove,
}: RequestPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-6">
      <div className="flex flex-col gap-1">
        <h2
          id="request-panel-heading"
          className="flex items-center gap-3 text-lg font-medium"
        >
          <span
            aria-hidden="true"
            className="grid size-6 place-items-center rounded-full bg-primary text-sm text-primary-foreground"
          >
            3
          </span>
          This request
        </h2>
        <p className="text-sm text-muted">
          {customerName ? (
            <>
              For <strong>{customerName}</strong>
            </>
          ) : (
            'No customer chosen yet'
          )}
        </p>
      </div>
      {lines.length === 0 ? (
        <p className="text-muted">
          Nothing here yet. Type a quantity next to a wine, or add wines from
          your recent ones or from last time.
        </p>
      ) : (
        <ol aria-label="Wines in this request" className="flex flex-col gap-3">
          {lines.map(({ wine, quantityText, status, sizeWarning }) => (
            <li
              key={wine.id}
              className={`grid grid-cols-[3rem_1fr_auto] items-start gap-x-3 gap-y-1 rounded-md border-l-4 px-3 py-2 ${lineToneClass[status.tone]}`}
            >
              <button
                type="button"
                onClick={() => onGoTo(wine.id)}
                aria-label={`${quantityText || 'No quantity'} of ${describeWine(wine)}. Go to its row.`}
                className="col-span-2 grid grid-cols-subgrid rounded-md text-left focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="font-bold">{quantityText || '—'}</span>
                <span className="flex flex-wrap items-center gap-2">
                  {wine.producer} {wine.wineName} {formatVintage(wine.vintage)}
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                    {formatBottleSize(wine.sizeMl)}
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-label={`Remove ${describeWine(wine)}`}
                onClick={() => onRemove(wine.id)}
                className="rounded-md px-2 text-lg leading-none text-muted hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-ring"
              >
                ×
              </button>
              <div className="col-start-2 col-span-2 flex flex-col gap-1 text-sm">
                <span className={statusClass[status.tone]}>{status.text}</span>
                {sizeWarning && (
                  <span className="text-warning">{sizeWarning}</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      <Summary lines={lines} policy={policy} />
    </div>
  );
}
