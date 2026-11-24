import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { isStrictBlocked } from './availability';
import type { GoTo } from './goTo';
import type { ProducerGroup } from './groupByProducer';
import { LastTimeHint } from './LastTimeHint';
import { WineRow } from './WineRow';

type ProducerGroupCardProps = {
  group: ProducerGroup;
  lines: Record<string, string>;
  policy: InventoryPolicy;
  // Wine id -> quantity from the customer's last order or request.
  lastTimeQuantities: Record<string, number>;
  goTo?: GoTo;
  onQuantityChange: (wineId: string, quantityText: string) => void;
};

export function ProducerGroupCard({
  group,
  lines,
  policy,
  lastTimeQuantities,
  goTo,
  onQuantityChange,
}: ProducerGroupCardProps) {
  const headingId = `producer-${group.producer.replace(/\W/g, '-')}`;
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-md border border-border p-4"
    >
      <h3 id={headingId} className="font-medium">
        {group.producer}
      </h3>
      {group.names.map(({ name, wines }) => (
        <div key={name}>
          <h4 className="px-3 text-sm font-medium text-muted">{name}</h4>
          <ul className="@container">
            {wines.map((wine) => (
              <WineRow
                key={wine.id}
                wine={wine}
                quantityText={lines[wine.id]}
                policy={policy}
                onQuantityChange={onQuantityChange}
                goTo={goTo}
                quickFill={
                  lastTimeQuantities[wine.id] !== undefined &&
                  !(
                    isStrictBlocked(wine.available, policy) &&
                    lines[wine.id] === undefined
                  ) && (
                    <LastTimeHint
                      wine={wine}
                      quantity={lastTimeQuantities[wine.id]}
                      onUse={onQuantityChange}
                    />
                  )
                }
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
