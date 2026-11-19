import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { describeAvailability, type AvailabilityLevel } from './availability';
import {
  blockedStatus,
  getLineStatus,
  type LineStatusTone,
} from './lineStatus';
import { sanitizeQuantity } from './quantity';
import {
  describeVintage,
  formatBottleSize,
  formatVintage,
  type Wine,
} from './wine';

type WineRowProps = {
  wine: Wine;
  // undefined means the wine is not in the request.
  quantityText: string | undefined;
  policy: InventoryPolicy;
  onQuantityChange: (wineId: string, quantityText: string) => void;
  quickFill?: React.ReactNode;
};

const availabilityClass: Record<AvailabilityLevel, string> = {
  calm: 'text-success',
  low: 'text-warning',
  out: 'text-danger',
};

const statusClass: Record<LineStatusTone, string> = {
  quiet: 'text-muted',
  ok: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
};

export function WineRow({
  wine,
  quantityText,
  policy,
  onQuantityChange,
  quickFill,
}: WineRowProps) {
  const isInRequest = quantityText !== undefined;
  const isBlocked = policy === 'strict' && wine.available === 0 && !isInRequest;
  const status = isInRequest
    ? getLineStatus({ quantityText, available: wine.available, policy })
    : isBlocked
      ? blockedStatus
      : undefined;
  const availability = describeAvailability(wine.available);
  const size = formatBottleSize(wine.sizeMl);
  const inputId = `quantity-${wine.id}`;
  const statusId = `status-${wine.id}`;

  return (
    <li
      className={`grid items-center gap-x-4 gap-y-1 rounded-md px-3 py-2 md:grid-cols-[3rem_5rem_7rem_9rem_8rem_1fr_6rem_auto] ${
        isInRequest ? 'bg-primary-soft' : ''
      }`}
    >
      <span className="text-sm font-medium">
        {wine.vintage === null ? (
          <abbr title={describeVintage(null)}>{formatVintage(null)}</abbr>
        ) : (
          formatVintage(wine.vintage)
        )}
      </span>
      <span className="w-fit rounded-full border border-border px-2 py-0.5 text-sm">
        {size}
      </span>
      <span className="text-sm text-muted">{wine.region}</span>
      <span className="font-mono text-sm text-muted">{wine.sku}</span>
      <span className={`text-sm ${availabilityClass[availability.level]}`}>
        {availability.text}
      </span>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span
          id={statusId}
          className={status ? statusClass[status.tone] : undefined}
        >
          {status?.text}
        </span>
        {status?.setTo !== undefined && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onQuantityChange(wine.id, String(status.setTo))}
          >
            Set to {status.setTo}
          </Button>
        )}
      </div>
      <div>
        <label htmlFor={inputId} className="sr-only">
          {`Quantity for ${wine.producer} ${wine.wineName} ${describeVintage(wine.vintage)}, ${size}`}
        </label>
        <Input
          id={inputId}
          type="text"
          inputMode="numeric"
          placeholder="Qty"
          className="w-full disabled:opacity-50"
          value={quantityText ?? ''}
          disabled={isBlocked}
          aria-invalid={status?.tone === 'error'}
          aria-describedby={status ? statusId : undefined}
          onChange={(event) =>
            onQuantityChange(wine.id, sanitizeQuantity(event.target.value))
          }
        />
      </div>
      <div>{quickFill}</div>
    </li>
  );
}
