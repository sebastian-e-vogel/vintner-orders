import Link from 'next/link';
import { formatDateTime } from '@/components/formatTimestamp';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { focusOnMount } from './focusHelpers';
import { policyLabel } from './RequestPanel';
import type { AnsweredSave } from './saveResult';
import { describeWine, type Wine } from './wine';

type OutcomeActions = {
  onBackToEdit: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onStartNext: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFixQuantities: (
    event: React.MouseEvent<HTMLButtonElement>,
    wineIds: string[],
  ) => void;
};

type SaveOutcomeProps = OutcomeActions & {
  result: AnsweredSave;
  customerName: string;
  wines: Wine[];
};

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

function Block({
  tone,
  heading,
  children,
}: {
  tone: 'success' | 'warning' | 'danger';
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div role="alert">
      <Banner tone={tone}>
        <h2 id="review-dialog-title" className="text-base font-medium">
          {heading}
        </h2>
        <div className="mt-2 flex flex-col gap-2">{children}</div>
      </Banner>
    </div>
  );
}

export function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex justify-end gap-3">{children}</div>;
}

function BackToEdit({ onBackToEdit }: Pick<OutcomeActions, 'onBackToEdit'>) {
  return (
    <Actions>
      <Button ref={focusOnMount} data-autofocus onClick={onBackToEdit}>
        Back to edit
      </Button>
    </Actions>
  );
}

export function SaveOutcome({
  result,
  customerName,
  wines,
  onBackToEdit,
  onStartNext,
  onFixQuantities,
}: SaveOutcomeProps) {
  const nameOf = (wineId: string) => {
    const wine = wines.find(({ id }) => id === wineId);
    return wine ? describeWine(wine) : 'A wine that is no longer listed';
  };

  if (result.status === 'saved') {
    const { createdAt, duplicate, lines, policy } = result.request;
    const bottles = lines.reduce((total, { quantity }) => total + quantity, 0);
    return (
      <>
        <Block tone="success" heading="Request saved">
          <p>{formatDateTime(createdAt)}</p>
          <p>
            <strong>{customerName}</strong>: {plural(lines.length, 'wine')},{' '}
            {plural(bottles, 'bottle')} · {policyLabel[policy]}
          </p>
          {duplicate && (
            <p>
              The first attempt had already saved this request, so no second
              copy was made.
            </p>
          )}
          <p>
            You can confirm it to the caller. It now waits for review, and no
            stock is reserved.
          </p>
        </Block>
        <Actions>
          <Link
            href="/requests"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            View saved requests
          </Link>
          <Button ref={focusOnMount} data-autofocus onClick={onStartNext}>
            Start next order
          </Button>
        </Actions>
      </>
    );
  }

  if (result.status === 'invalid') {
    return (
      <>
        <Block tone="danger" heading="The server rejected some details">
          <ul className="list-disc pl-5">
            {Object.entries(result.fieldErrors).map(([path, message]) => (
              <li key={path}>{message}</li>
            ))}
          </ul>
          <p>Your order is kept. Fix these and save again.</p>
        </Block>
        <BackToEdit onBackToEdit={onBackToEdit} />
      </>
    );
  }

  const { rejection } = result;
  switch (rejection.reason) {
    case 'unknown_customer':
      return (
        <>
          <Block tone="danger" heading="This customer no longer exists">
            <p>Your order is kept. Choose a customer again, then save.</p>
          </Block>
          <BackToEdit onBackToEdit={onBackToEdit} />
        </>
      );
    case 'unknown_wines':
      return (
        <>
          <Block tone="danger" heading="Some wines are no longer available">
            <ul className="list-disc pl-5">
              {rejection.wineIds.map((wineId) => (
                <li key={wineId}>{nameOf(wineId)}</li>
              ))}
            </ul>
            <p>Remove them from the request, then save again.</p>
          </Block>
          <BackToEdit onBackToEdit={onBackToEdit} />
        </>
      );
    case 'over_stock': {
      const shortLines = rejection.lines.filter(({ shortBy }) => shortBy > 0);
      return (
        <>
          <Block tone="warning" heading="Stock changed: some lines are short">
            <p>
              The inventory policy is now{' '}
              <strong>{policyLabel[rejection.policy]}</strong>.
            </p>
            <ul className="list-disc pl-5">
              {shortLines.map(({ wineId, quantity, available }) => (
                <li key={wineId}>
                  {nameOf(wineId)}: requested {quantity}, {available} available
                </li>
              ))}
            </ul>
          </Block>
          <Actions>
            <Button
              ref={focusOnMount}
              data-autofocus
              onClick={(event) =>
                onFixQuantities(
                  event,
                  shortLines.map(({ wineId }) => wineId),
                )
              }
            >
              Fix quantities
            </Button>
          </Actions>
        </>
      );
    }
    case 'idempotency_key_reused':
      return (
        <>
          <Block tone="warning" heading="This request was not saved">
            <p>
              The save attempt clashed with an earlier one. Nothing was saved,
              so save it again.
            </p>
          </Block>
          <BackToEdit onBackToEdit={onBackToEdit} />
        </>
      );
  }
}
