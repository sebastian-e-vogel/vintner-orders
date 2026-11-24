import { useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import {
  describeAvailability,
  isStrictBlocked,
  type AvailabilityLevel,
} from './availability';
import {
  blockedStatus,
  getLineStatus,
  type LineStatusTone,
} from './lineStatus';
import type { Wine } from '@vintner/contracts';
import { focusQuantity, type GoTo } from './goTo';
import { sanitizeQuantity } from './quantity';
import {
  describeVintage,
  describeWine,
  formatBottleSize,
  formatVintage,
} from './wine';

type WineRowProps = {
  wine: Wine;
  // undefined means the wine is not in the request.
  quantityText: string | undefined;
  policy: InventoryPolicy;
  onQuantityChange: (wineId: string, quantityText: string) => void;
  goTo?: GoTo;
  quickFill?: React.ReactNode;
};

const availabilityClass: Record<AvailabilityLevel, string> = {
  calm: 'text-success',
  low: 'text-warning',
  out: 'text-danger',
};

export const statusClass: Record<LineStatusTone, string> = {
  input: 'text-foreground',
  ok: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
};

// Background and left border by line level, shared by the wine row and the request panel.
export const lineToneClass: Record<LineStatusTone, string> = {
  input: 'border-warning bg-warning-soft',
  ok: 'border-success bg-success-soft',
  warning: 'border-warning bg-warning-soft',
  error: 'border-danger bg-danger-soft',
};

export function WineRow({
  wine,
  quantityText,
  policy,
  onQuantityChange,
  goTo,
  quickFill,
}: WineRowProps) {
  const handledToken = useRef<number>(undefined);
  const isInRequest = quantityText !== undefined;
  const isBlocked = isStrictBlocked(wine.available, policy) && !isInRequest;
  const status = isInRequest
    ? getLineStatus({ quantityText, available: wine.available, policy })
    : isBlocked
      ? blockedStatus
      : undefined;
  const availability = describeAvailability(wine.available);
  const size = formatBottleSize(wine.sizeMl);
  const inputId = `quantity-${wine.id}`;
  const statusId = `status-${wine.id}`;
  const highlightClass = goTo?.highlightIds.includes(wine.id)
    ? goTo.token % 2 === 0
      ? 'animate-row-highlight-a motion-reduce:animate-none'
      : 'animate-row-highlight-b motion-reduce:animate-none'
    : '';
  // Focus once per request: the ref callback runs again on every render.
  function takeFocus(input: HTMLInputElement | null) {
    if (
      !input ||
      goTo?.wineId !== wine.id ||
      handledToken.current === goTo.token
    )
      return;
    handledToken.current = goTo.token;
    focusQuantity(input);
  }

  return (
    <li
      className={`flex scroll-mt-4 flex-wrap items-center gap-x-3 gap-y-1 rounded-md border-l-4 px-3 py-2 min-[860px]:grid min-[860px]:grid-cols-[2.5rem_4.5rem_minmax(0,1fr)_7rem_5rem] min-[1240px]:grid-cols-[2.5rem_4.5rem_minmax(0,1fr)_9rem_7rem_5rem] ${
        isInRequest && status
          ? lineToneClass[status.tone]
          : 'border-transparent'
      } ${highlightClass}`}
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
      <span className="truncate text-sm text-muted" title={wine.region}>
        {wine.region}
      </span>
      <span className="hidden font-mono text-sm text-muted min-[1240px]:block">
        {wine.sku}
      </span>
      <span className={`text-sm ${availabilityClass[availability.level]}`}>
        {availability.text}
      </span>
      <div className="w-24 min-[860px]:w-auto">
        <label htmlFor={inputId} className="sr-only">
          {`Quantity for ${describeWine(wine)}`}
        </label>
        <Input
          id={inputId}
          ref={takeFocus}
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
      {(status || quickFill) && (
        <div className="flex w-full flex-wrap items-center gap-2 text-sm min-[860px]:col-span-full">
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
          {quickFill}
        </div>
      )}
    </li>
  );
}
