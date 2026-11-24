import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import type { ItemState, LastTimeItem } from './lastTime';
import {
  describeVintage,
  describeWine,
  formatBottleSize,
  formatVintage,
} from './wine';

type LastTimeItemRowProps = {
  item: LastTimeItem;
  state: ItemState;
  policy: InventoryPolicy;
  // Adds the wine with an empty quantity and goes to it.
  onAdd: (wineId: string) => void;
  // Goes to a wine that is already in the request.
  onGoTo: (wineId: string) => void;
};

export function LastTimeItemRow({
  item,
  state,
  policy,
  onAdd,
  onGoTo,
}: LastTimeItemRowProps) {
  const { wine, quantity } = item;
  const isOutOfStock = wine.available === 0;
  const name = describeWine(wine);
  const isDisabled = state === 'blocked' || state === 'discontinued';
  const label = {
    addable: `Add ${name} without a quantity, last time ${quantity}`,
    'in-request': `Go to ${name}, already in this request, last time ${quantity}`,
    blocked: `${name}, out of stock, can't be added under strict policy`,
    discontinued: `${name}, discontinued, can't be added`,
  }[state];

  return (
    <li>
      <button
        type="button"
        aria-label={label}
        aria-disabled={isDisabled}
        onClick={() => {
          if (state === 'addable') onAdd(wine.id);
          else if (state === 'in-request') onGoTo(wine.id);
        }}
        className={`flex h-full w-full flex-col items-start gap-1 rounded-md border border-border px-3 py-2 text-left text-sm hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-disabled:opacity-50 aria-disabled:hover:border-border ${
          state === 'in-request' ? 'bg-success-soft' : ''
        }`}
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{quantity} ×</span>
          <span>
            {wine.producer} {wine.name}{' '}
            {wine.vintage === null ? (
              <abbr title={describeVintage(null)}>{formatVintage(null)}</abbr>
            ) : (
              formatVintage(wine.vintage)
            )}
          </span>
          <span className="rounded-full border border-border px-2 py-0.5">
            {formatBottleSize(wine.sizeMl)}
          </span>
        </span>
        {state === 'in-request' && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            In request
          </span>
        )}
        {state === 'discontinued' && (
          <span className="text-muted">
            This wine has been discontinued, so it cannot be added.
          </span>
        )}
        {isOutOfStock && state === 'blocked' && (
          <span className="text-danger">
            Out of stock — can&apos;t add (strict)
          </span>
        )}
        {isOutOfStock && state === 'addable' && policy === 'flexible' && (
          <span className="text-warning">
            Out of stock — will be flagged short
          </span>
        )}
      </button>
    </li>
  );
}
