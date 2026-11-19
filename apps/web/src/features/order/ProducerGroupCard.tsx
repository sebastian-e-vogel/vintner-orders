import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import type { ProducerGroup } from './groupByProducer';
import { WineRow } from './WineRow';

type ProducerGroupCardProps = {
  group: ProducerGroup;
  lines: Record<string, string>;
  policy: InventoryPolicy;
  onQuantityChange: (wineId: string, quantityText: string) => void;
};

export function ProducerGroupCard({
  group,
  lines,
  policy,
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
      {group.wineNames.map(({ wineName, wines }) => (
        <div key={wineName}>
          <h4 className="px-3 text-sm font-medium text-muted">{wineName}</h4>
          <ul>
            {wines.map((wine) => (
              <WineRow
                key={wine.id}
                wine={wine}
                quantityText={lines[wine.id]}
                policy={policy}
                onQuantityChange={onQuantityChange}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
