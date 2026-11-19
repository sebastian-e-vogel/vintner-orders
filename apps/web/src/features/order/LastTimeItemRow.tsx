import { Button } from '@/components/ui/Button';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import type { ItemState, LastTimeItem } from './lastTime';
import {
  describeVintage,
  describeWine,
  formatBottleSize,
  formatVintage,
  type Wine,
} from './wine';

type LastTimeItemRowProps = {
  item: LastTimeItem;
  // undefined when the wine is no longer in the catalog.
  wine: Wine | undefined;
  state: ItemState;
  policy: InventoryPolicy;
  onAdd: (wineId: string) => void;
};

export function LastTimeItemRow({
  item,
  wine,
  state,
  policy,
  onAdd,
}: LastTimeItemRowProps) {
  const isOutOfStock = wine !== undefined && wine.available === 0;

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
      <div className="flex flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{item.quantity} ×</span>
          {wine ? (
            <>
              <span>
                {wine.producer} {wine.wineName}{' '}
                {wine.vintage === null ? (
                  <abbr title={describeVintage(null)}>
                    {formatVintage(null)}
                  </abbr>
                ) : (
                  formatVintage(wine.vintage)
                )}
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 text-sm">
                {formatBottleSize(wine.sizeMl)}
              </span>
            </>
          ) : (
            <span className="text-muted">Wine no longer in the catalog</span>
          )}
        </div>
        {state === 'missing' && (
          <p className="text-sm text-muted">
            This wine is not in the catalog any more, so it cannot be added.
          </p>
        )}
        {isOutOfStock && state === 'blocked' && (
          <p className="text-sm text-danger">
            Out of stock — can&apos;t add (strict)
          </p>
        )}
        {isOutOfStock && state === 'addable' && policy === 'flexible' && (
          <p className="text-sm text-warning">
            Out of stock — will be flagged short
          </p>
        )}
      </div>
      {state === 'in-request' ? (
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium">
          In request
        </span>
      ) : (
        wine && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={state !== 'addable'}
            onClick={() => onAdd(wine.id)}
          >
            Add{' '}
            <span className="sr-only">
              {describeWine(wine)} without a quantity, last time {item.quantity}
            </span>
          </Button>
        )
      )}
    </li>
  );
}
