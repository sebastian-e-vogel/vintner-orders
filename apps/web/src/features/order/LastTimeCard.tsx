import { formatDate } from '@/components/formatTimestamp';
import { Spinner } from '@/components/ui/Spinner';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import type { LastTime, SkippedCounts } from './lastTime';
import { LastTimeItems } from './LastTimeItems';

type LastTimeCardProps = {
  customerName: string;
  isLoading: boolean;
  // undefined means the customer has no orders or pending requests.
  last: LastTime | undefined;
  lines: Record<string, string>;
  policy: InventoryPolicy;
  onAdd: (wineIds: string[], source?: string, skipped?: SkippedCounts) => void;
};

function Body({
  customerName,
  isLoading,
  last,
  lines,
  policy,
  onAdd,
}: LastTimeCardProps) {
  if (isLoading) {
    return (
      <p
        role="status"
        aria-busy="true"
        className="flex items-center gap-2 text-muted"
      >
        <Spinner />
        Loading last time for {customerName}…
      </p>
    );
  }
  if (!last) {
    return (
      <p className="text-muted">
        No previous orders or saved requests for {customerName}.
      </p>
    );
  }

  const isOrder = last.kind === 'order';

  return (
    <>
      <div className="flex flex-col gap-1">
        <span
          className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
            isOrder ? 'border border-border' : 'bg-warning-soft text-warning'
          }`}
        >
          {isOrder ? 'Past order' : 'Saved request · pending review'}
        </span>
        <p className="text-sm text-muted">
          {formatDate(last.date)} ·{' '}
          {isOrder
            ? `taken by ${last.repName || '-'}`
            : `caller ${last.contactName}`}
        </p>
        {!isOrder && (
          <p className="text-sm text-warning">
            Nobody has reviewed this request yet. Check it is not a repeat of
            what the caller is asking for now.
          </p>
        )}
      </div>
      <LastTimeItems
        items={last.items}
        lines={lines}
        policy={policy}
        onAdd={onAdd}
      />
    </>
  );
}

export function LastTimeCard(props: LastTimeCardProps) {
  return (
    <section
      aria-labelledby="last-time-heading"
      className="mt-6 flex max-w-[60rem] flex-col gap-4 rounded-md border border-border bg-surface p-6"
    >
      <h2 id="last-time-heading" className="text-lg font-medium">
        Last time
      </h2>
      <Body {...props} />
    </section>
  );
}
