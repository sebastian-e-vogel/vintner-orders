'use client';

import { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import {
  allProducers,
  groupByProducer,
  producerOptions,
} from './groupByProducer';
import { ProducerGroupCard } from './ProducerGroupCard';
import type { Wine } from './wine';

type WineSectionProps = {
  wines: Wine[];
  lines: Record<string, string>;
  policy: InventoryPolicy;
  lastTimeQuantities: Record<string, number>;
  // Latest add message, announced to screen readers.
  statusMessage: string;
  onQuantityChange: (wineId: string, quantityText: string) => void;
};

export function WineSection({
  wines,
  lines,
  policy,
  lastTimeQuantities,
  statusMessage,
  onQuantityChange,
}: WineSectionProps) {
  const [producer, setProducer] = useState(allProducers);
  const groups = groupByProducer(wines, producer);

  return (
    <section
      aria-labelledby="wines-heading"
      className="mt-6 flex max-w-[60rem] flex-col gap-5 rounded-md border border-border bg-surface p-6"
    >
      <h2
        id="wines-heading"
        className="flex items-center gap-3 text-lg font-medium"
      >
        <span
          aria-hidden="true"
          className="grid size-6 place-items-center rounded-full bg-primary text-sm text-primary-foreground"
        >
          2
        </span>
        Wines — type a quantity to add it
      </h2>
      <div className="max-w-md">
        <Field
          id="wine-filter"
          label="Show"
          help="Type a letter to jump to a producer in the list, then press Tab to reach the first quantity."
        >
          {(controlProps) => (
            <Select
              {...controlProps}
              value={producer}
              onChange={(event) => setProducer(event.target.value)}
            >
              <option value={allProducers}>All producers</option>
              {producerOptions(wines).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <p role="status" className="text-sm">
        {statusMessage}
      </p>
      {groups.length === 0 ? (
        <p className="text-muted">No wines to show.</p>
      ) : (
        groups.map((group) => (
          <ProducerGroupCard
            key={group.producer}
            group={group}
            lines={lines}
            policy={policy}
            lastTimeQuantities={lastTimeQuantities}
            onQuantityChange={onQuantityChange}
          />
        ))
      )}
    </section>
  );
}
