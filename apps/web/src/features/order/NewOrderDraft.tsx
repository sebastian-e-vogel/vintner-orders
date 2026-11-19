'use client';

import { useRouter } from 'next/navigation';
import { useOptimistic, useState, useTransition } from 'react';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { CallerSection } from './CallerSection';
import type { Customer } from './customer';
import { addedMessage, type LastTime, type SkippedCounts } from './lastTime';
import { LastTimeCard } from './LastTimeCard';
import { RecentWines } from './RecentWines';
import { RequestPanel } from './RequestPanel';
import { buildRequestLines } from './requestLines';
import { WineSection } from './WineSection';
import { describeWine, type Wine } from './wine';

type NewOrderDraftProps = {
  customers: Customer[];
  customerId: string;
  wines: Wine[];
  recentWines: Wine[];
  policy: InventoryPolicy;
  // undefined means the customer has no orders or pending requests.
  lastTime?: LastTime;
};

// Temporarily owns the whole draft: the caller and the request lines (wine id -> quantity text).
// Lines are not kept across a refresh yet; the review-and-save flow decides how the draft survives.
export function NewOrderDraft({
  customers,
  customerId,
  wines,
  recentWines,
  policy,
  lastTime,
}: NewOrderDraftProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Shows the chosen customer straight away while the URL change loads.
  const [chosenId, setChosenId] = useOptimistic(customerId);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [lines, setLines] = useState<Record<string, string>>({});
  const [addMessage, setAddMessage] = useState('');

  const chosenCustomer = customers.find(({ id }) => id === chosenId);
  const lastTimeQuantities = Object.fromEntries(
    (lastTime?.items ?? []).map(({ wine, quantity }) => [wine.id, quantity]),
  );

  const requestLines = buildRequestLines(wines, lines, policy);

  function handleCustomerChange(nextId: string) {
    const previous = customers.find(({ id }) => id === chosenId);
    if (previous?.contactName === name && previous.phone === phone) {
      setName('');
      setPhone('');
    }
    startTransition(() => {
      setChosenId(nextId);
      router.replace(
        nextId ? `/?customer=${encodeURIComponent(nextId)}` : '/',
        {
          scroll: false,
        },
      );
    });
  }

  // Puts wines in the request with an empty quantity and announces it in the catalog.
  // Wines already in the request or missing from the catalog are left alone.
  // `source` and `skipped` only describe a bulk add, such as "Add all" from last time.
  function addWines(
    wineIds: string[],
    source?: string,
    skipped?: SkippedCounts,
  ) {
    const added = wines.filter(
      ({ id }) => wineIds.includes(id) && lines[id] === undefined,
    );
    if (added.length === 0) return;
    setLines((current) => ({
      ...current,
      ...Object.fromEntries(added.map(({ id }) => [id, ''])),
    }));
    setAddMessage(addedMessage(added, source, skipped));
  }

  function handleRemove(wineId: string) {
    const wine = wines.find(({ id }) => id === wineId);
    setLines((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([id]) => id !== wineId),
      ),
    );
    if (wine) setAddMessage(`Removed ${describeWine(wine)} from the request.`);
  }

  function handleRecentPick(wineId: string) {
    const wine = wines.find(({ id }) => id === wineId);
    if (!wine) return;
    if (lines[wineId] === undefined) {
      addWines([wineId]);
    } else {
      setAddMessage(`${describeWine(wine)} is already in the request.`);
    }
  }

  return (
    <>
      <CallerSection
        customers={customers}
        customerId={chosenId}
        name={name}
        phone={phone}
        errors={{}}
        onCustomerChange={handleCustomerChange}
        onNameChange={setName}
        onPhoneChange={setPhone}
      />
      {chosenCustomer && (
        <LastTimeCard
          customerName={chosenCustomer.companyName}
          isLoading={isPending}
          last={lastTime}
          lines={lines}
          policy={policy}
          onAdd={addWines}
        />
      )}
      <div className="mt-6 grid items-start gap-6 min-[860px]:grid-cols-[minmax(0,1fr)_22.5rem] min-[1240px]:grid-cols-[18rem_minmax(0,1fr)_22.5rem]">
        <div className="min-[860px]:col-start-1 min-[860px]:row-start-1">
          <RecentWines
            wines={recentWines}
            lines={lines}
            policy={policy}
            onPick={handleRecentPick}
          />
        </div>
        <div className="min-w-0 min-[860px]:col-start-1 min-[860px]:row-start-2 min-[1240px]:col-start-2 min-[1240px]:row-start-1">
          <WineSection
            wines={wines}
            lines={lines}
            policy={policy}
            lastTimeQuantities={lastTimeQuantities}
            statusMessage={addMessage}
            onQuantityChange={(wineId, text) =>
              setLines((current) => ({ ...current, [wineId]: text }))
            }
          />
        </div>
        <aside
          aria-label="This request"
          className="min-[860px]:sticky min-[860px]:top-4 min-[860px]:col-start-2 min-[860px]:row-span-2 min-[860px]:row-start-1 min-[860px]:max-h-[calc(100vh-2rem)] min-[860px]:overflow-y-auto min-[860px]:[scrollbar-width:thin] min-[1240px]:col-start-3 min-[1240px]:row-span-1"
        >
          <RequestPanel
            customerName={chosenCustomer?.companyName}
            lines={requestLines}
            policy={policy}
            onRemove={handleRemove}
          />
        </aside>
      </div>
    </>
  );
}
