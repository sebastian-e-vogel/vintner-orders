import { Button } from '@/components/ui/Button';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import {
  addAllLabel,
  itemState,
  summarizeAddAll,
  type LastTimeItem,
  type SkippedCounts,
} from './lastTime';
import { LastTimeItemRow } from './LastTimeItemRow';
import type { Wine } from './wine';

type LastTimeItemsProps = {
  items: LastTimeItem[];
  wines: Wine[];
  lines: Record<string, string>;
  policy: InventoryPolicy;
  onAdd: (wineIds: string[], source?: string, skipped?: SkippedCounts) => void;
};

export function LastTimeItems({
  items,
  wines,
  lines,
  policy,
  onAdd,
}: LastTimeItemsProps) {
  const summary = summarizeAddAll(items, wines, lines, policy);

  return (
    <>
      <ul aria-label="Wines last time" className="divide-y divide-border">
        {items.map((item) => {
          const wine = wines.find(({ id }) => id === item.wineId);
          return (
            <LastTimeItemRow
              key={item.wineId}
              item={item}
              wine={wine}
              state={itemState(wine, lines, policy)}
              policy={policy}
              onAdd={(wineId) => onAdd([wineId])}
            />
          );
        })}
      </ul>
      <div className="flex flex-col items-start gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={summary.addableIds.length === 0}
          onClick={() =>
            onAdd(summary.addableIds, 'from last time', {
              inRequest: summary.inRequest,
              blocked: summary.blocked,
            })
          }
        >
          {addAllLabel(summary)}
        </Button>
        <p className="text-sm text-muted">
          Wines are added without quantities. Click &quot;Last time: N&quot; on
          a wine in the list below to use last time&apos;s quantity.
        </p>
      </div>
    </>
  );
}
