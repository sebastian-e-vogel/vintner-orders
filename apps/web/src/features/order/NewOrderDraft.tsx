'use client';

import { useRouter } from 'next/navigation';
import { useOptimistic, useRef, useState, useTransition } from 'react';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { CallerSection } from './CallerSection';
import { LockGroup } from './LockGroup';
import { checkDraft, type ReviewTarget } from './reviewCheck';
import { ReviewDialog, type ReviewPhase } from './ReviewDialog';
import { buildReviewSnapshot, type ReviewSnapshot } from './reviewSnapshot';
import { isAnswered, type OnSave, type SaveResult } from './saveResult';
import { useReviewShortcut } from './useReviewShortcut';
import { isStrictBlocked } from './availability';
import type { Customer } from './customer';
import type { GoTo } from './goTo';
import { addedMessage, type LastTime, type SkippedCounts } from './lastTime';
import { LastTimeCard } from './LastTimeCard';
import { RecentWines } from './RecentWines';
import { RequestPanel } from './RequestPanel';
import { buildRequestLines } from './requestLines';
import { allProducers } from './groupByProducer';
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
  // Saves the request. Not connected yet: without it the dialog cannot save.
  onSave?: OnSave;
};

type SaveFlow = {
  snapshot: ReviewSnapshot;
  phase: ReviewPhase;
  // Stays false after "Close (keep order)" while the save is still unconfirmed.
  isOpen: boolean;
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
  onSave,
}: NewOrderDraftProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Shows the chosen customer straight away while the URL change loads.
  const [chosenId, setChosenId] = useOptimistic(customerId);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [lines, setLines] = useState<Record<string, string>>({});
  const [addMessage, setAddMessage] = useState('');
  const [producer, setProducer] = useState(allProducers);
  const [goTo, setGoTo] = useState<GoTo>();
  const [notes, setNotes] = useState('');
  // Counts review attempts: errors show from the first one, and each one refocuses the summary.
  const [reviewAttempts, setReviewAttempts] = useState(0);
  const [flow, setFlow] = useState<SaveFlow>();
  // One key per draft, made when saving starts. It survives only an unconfirmed save.
  const [idempotencyKey, setIdempotencyKey] = useState<string>();
  const customerRef = useRef<HTMLSelectElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const producerRef = useRef<HTMLSelectElement>(null);

  const chosenCustomer = customers.find(({ id }) => id === chosenId);
  const lastTimeQuantities = Object.fromEntries(
    (lastTime?.items ?? []).map(({ wine, quantity }) => [wine.id, quantity]),
  );

  const requestLines = buildRequestLines(wines, lines, policy);
  const issues = checkDraft({
    customerId: chosenId,
    name,
    phone,
    notes,
    lines: requestLines,
  });
  const showErrors = reviewAttempts > 0;
  const messageFor = (target: ReviewTarget) =>
    showErrors
      ? issues.find((issue) => issue.target === target)?.message
      : undefined;
  const isLocked =
    flow?.phase.kind === 'unconfirmed' ||
    (flow?.phase.kind === 'saving' && flow.phase.isRetry);

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

  // Moves the rep to the first wine's quantity and highlights all of them. Focus is
  // applied by the row once it renders, so a hidden wine first resets the filter.
  function goToWines(wineIds: string[]) {
    const isHidden = wines.some(
      (wine) => wineIds.includes(wine.id) && wine.producer !== producer,
    );
    if (producer !== allProducers && isHidden) setProducer(allProducers);
    setGoTo((previous) => ({
      wineId: wineIds[0],
      highlightIds: wineIds,
      token: (previous?.token ?? 0) + 1,
    }));
  }

  function handleGoToLine(wineId: string) {
    setAddMessage('');
    goToWines([wineId]);
  }

  function handleGoToIssue(target: ReviewTarget) {
    if (typeof target === 'object') return handleGoToLine(target.wineId);
    const fields = {
      customer: customerRef,
      name: nameRef,
      phone: phoneRef,
      notes: notesRef,
      producer: producerRef,
    };
    fields[target].current?.focus();
  }

  function handleReview() {
    if (flow?.isOpen) return;
    if (flow?.phase.kind === 'unconfirmed') {
      setFlow({ ...flow, isOpen: true });
      return;
    }
    setReviewAttempts((attempts) => attempts + 1);
    if (issues.length > 0) return;
    setFlow({
      snapshot: buildReviewSnapshot({
        customerId: chosenId,
        customerName: chosenCustomer?.companyName ?? '',
        name,
        phone,
        notes,
        lines: requestLines,
      }),
      phase: { kind: 'review' },
      isOpen: true,
    });
  }

  useReviewShortcut(handleReview);

  function closeDialog() {
    setFlow((current) =>
      current?.phase.kind === 'unconfirmed'
        ? { ...current, isOpen: false }
        : undefined,
    );
  }

  function clearDraft() {
    handleCustomerChange('');
    setName('');
    setPhone('');
    setLines({});
    setNotes('');
    setProducer(allProducers);
    setGoTo(undefined);
    setAddMessage('');
    setReviewAttempts(0);
  }

  async function handleSave() {
    if (!onSave || !flow || flow.phase.kind === 'saving') return;
    const { snapshot } = flow;
    const key = idempotencyKey ?? crypto.randomUUID();
    setIdempotencyKey(key);
    setFlow({
      ...flow,
      phase: { kind: 'saving', isRetry: flow.phase.kind === 'unconfirmed' },
    });
    let result: SaveResult;
    try {
      result = await onSave(snapshot.input, key);
    } catch {
      result = { status: 'error' };
    }
    if (!isAnswered(result)) {
      setFlow({ snapshot, phase: { kind: 'unconfirmed' }, isOpen: true });
      return;
    }
    setIdempotencyKey(undefined);
    if (result.status === 'saved') clearDraft();
    setFlow({ snapshot, phase: { kind: 'answered', result }, isOpen: true });
  }

  // Goes to the first short wine that is still in the draft, or else the first line.
  function handleFixQuantities(wineIds: string[]) {
    closeDialog();
    const inDraft = requestLines.map(({ wine }) => wine.id);
    const target = wineIds.filter((id) => inDraft.includes(id));
    goToWines(target.length > 0 ? target : inDraft.slice(0, 1));
  }

  function handleProducerChange(next: string) {
    setProducer(next);
    // A later filter change must not replay the old move when rows remount.
    setGoTo(undefined);
  }

  // Puts wines in the request with an empty quantity, announces it in the catalog
  // and goes to the first one. Wines already in the request or missing from the
  // catalog are left alone. `source` and `skipped` only describe a bulk add, such
  // as "Add all" from last time, which also goes through and highlights the
  // last-time wines that were already in the request.
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
    const addedIds = added.map(({ id }) => id);
    goToWines(
      source
        ? (lastTime?.items ?? [])
            .map(({ wine }) => wine.id)
            .filter((id) => addedIds.includes(id) || lines[id] !== undefined)
        : addedIds,
    );
  }

  function handleRemove(wineId: string) {
    setLines((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([id]) => id !== wineId),
      ),
    );
    setAddMessage('');
  }

  // Picking a recent wine only moves the rep to its quantity: the line appears once they type.
  function handleRecentPick(wineId: string) {
    const wine = wines.find(({ id }) => id === wineId);
    if (!wine) return;
    const name = describeWine(wine);
    if (lines[wineId] !== undefined) {
      setAddMessage('');
    } else if (isStrictBlocked(wine.available, policy)) {
      setAddMessage(
        `${name} can't be added: it's out of stock under the strict policy.`,
      );
      return;
    } else {
      setAddMessage(`Type the quantity for ${name}.`);
    }
    goToWines([wineId]);
  }

  return (
    <>
      <LockGroup isLocked={isLocked}>
        <CallerSection
          customers={customers}
          customerId={chosenId}
          name={name}
          phone={phone}
          errors={{
            customer: messageFor('customer'),
            name: messageFor('name'),
            phone: messageFor('phone'),
          }}
          customerRef={customerRef}
          nameRef={nameRef}
          phoneRef={phoneRef}
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
            onGoTo={handleGoToLine}
          />
        )}
      </LockGroup>
      <div className="mt-6 grid items-start gap-6 min-[860px]:grid-cols-[minmax(0,1fr)_22.5rem] min-[1240px]:grid-cols-[18rem_minmax(0,1fr)_22.5rem]">
        <div className="min-[860px]:col-start-1 min-[860px]:row-start-1">
          <LockGroup isLocked={isLocked}>
            <RecentWines
              wines={recentWines}
              lines={lines}
              policy={policy}
              onPick={handleRecentPick}
            />
          </LockGroup>
        </div>
        <div className="min-w-0 min-[860px]:col-start-1 min-[860px]:row-start-2 min-[1240px]:col-start-2 min-[1240px]:row-start-1">
          <LockGroup isLocked={isLocked}>
            <WineSection
              wines={wines}
              lines={lines}
              policy={policy}
              lastTimeQuantities={lastTimeQuantities}
              statusMessage={addMessage}
              producer={producer}
              producerRef={producerRef}
              goTo={goTo}
              onProducerChange={handleProducerChange}
              onQuantityChange={(wineId, text) =>
                setLines((current) => ({ ...current, [wineId]: text }))
              }
            />
          </LockGroup>
        </div>
        <aside
          aria-label="This request"
          className="min-[860px]:sticky min-[860px]:top-4 min-[860px]:col-start-2 min-[860px]:row-span-2 min-[860px]:row-start-1 min-[860px]:max-h-[calc(100vh-2rem)] min-[860px]:overflow-y-auto min-[860px]:[scrollbar-width:thin] min-[1240px]:col-start-3 min-[1240px]:row-span-1"
        >
          <RequestPanel
            customerName={chosenCustomer?.companyName}
            lines={requestLines}
            policy={policy}
            notes={notes}
            notesRef={notesRef}
            notesError={messageFor('notes')}
            issues={showErrors ? issues : []}
            summaryKey={reviewAttempts}
            isLocked={isLocked}
            onNotesChange={setNotes}
            onGoToIssue={handleGoToIssue}
            onGoTo={handleGoToLine}
            onRemove={handleRemove}
            onReview={handleReview}
          />
        </aside>
      </div>
      {flow?.isOpen && (
        <ReviewDialog
          snapshot={flow.snapshot}
          phase={flow.phase}
          wines={wines}
          canSave={onSave !== undefined}
          onSave={handleSave}
          onClose={closeDialog}
          onStartNext={() => {
            closeDialog();
            customerRef.current?.focus();
          }}
          onFixQuantities={handleFixQuantities}
        />
      )}
    </>
  );
}
