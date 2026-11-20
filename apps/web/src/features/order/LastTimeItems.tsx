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

type LastTimeItemsProps = {
  items: LastTimeItem[];
  lines: Record<string, string>;
  policy: InventoryPolicy;
  onAdd: (wineIds: string[], source?: string, skipped?: SkippedCounts) => void;
  onGoTo: (wineId: string) => void;
};

export function LastTimeItems({
  items,
  lines,
  policy,
  onAdd,
  onGoTo,
}: LastTimeItemsProps) {
  const summary = summarizeAddAll(items, lines, policy);

  return (
    <>
      <ul
        aria-label="Wines last time"
        className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3"
      >
        {items.map((item) => (
          <LastTimeItemRow
            key={item.wine.id}
            item={item}
            state={itemState(item, lines, policy)}
            policy={policy}
            onAdd={(wineId) => onAdd([wineId])}
            onGoTo={onGoTo}
          />
        ))}
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
