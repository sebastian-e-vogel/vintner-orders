import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import { focusOnMount, openModal } from './focusHelpers';
import { ReadBack } from './ReadBack';
import { Actions, SaveOutcome } from './SaveOutcome';
import type { ReviewSnapshot } from './reviewSnapshot';
import type { AnsweredSave } from './saveResult';

export type ReviewPhase =
  | { kind: 'review' }
  | { kind: 'saving'; isRetry: boolean }
  | { kind: 'unconfirmed' }
  | { kind: 'answered'; result: AnsweredSave };

type ReviewDialogProps = {
  snapshot: ReviewSnapshot;
  phase: ReviewPhase;
  // False until the page passes a save function.
  canSave: boolean;
  onSave: () => void;
  onClose: () => void;
  onStartNext: () => void;
  onFixQuantities: (wineIds: string[]) => void;
};

// The page behind a modal dialog is inert, so the dialog closes before focus moves there.
function closeDialogOf(button: HTMLElement) {
  button.closest('dialog')?.close();
}

export function ReviewDialog({
  snapshot,
  phase,
  canSave,
  onSave,
  onClose,
  onStartNext,
  onFixQuantities,
}: ReviewDialogProps) {
  const isSaving = phase.kind === 'saving';

  return (
    <Dialog
      ref={openModal}
      labelledBy="review-dialog-title"
      size="lg"
      onCancel={(event) => {
        // Always handled here so the state and the dialog cannot disagree.
        event.preventDefault();
        if (!isSaving) onClose();
      }}
    >
      {phase.kind === 'answered' && (
        <SaveOutcome
          result={phase.result}
          customerName={snapshot.customerName}
          wines={snapshot.lines.map(({ wine }) => wine)}
          onBackToEdit={onClose}
          onStartNext={(event) => {
            closeDialogOf(event.currentTarget);
            onStartNext();
          }}
          onFixQuantities={(event, wineIds) => {
            closeDialogOf(event.currentTarget);
            onFixQuantities(wineIds);
          }}
        />
      )}
      {phase.kind === 'unconfirmed' && (
        <>
          <div role="alert">
            <Banner tone="warning">
              <h2 id="review-dialog-title" className="text-base font-medium">
                We couldn&apos;t confirm the save
              </h2>
              <p className="mt-2">
                The request may or may not have been saved. Don&apos;t tell the
                caller it is saved yet. Retrying is safe: it can&apos;t create a
                duplicate.
              </p>
            </Banner>
          </div>
          <div className="mt-4">
            <ReadBack snapshot={snapshot} isDimmed />
          </div>
          <Actions>
            <Button variant="secondary" onClick={onClose}>
              Close (keep order)
            </Button>
            <Button ref={focusOnMount} data-autofocus onClick={onSave}>
              Retry save
            </Button>
          </Actions>
        </>
      )}
      {(phase.kind === 'review' || phase.kind === 'saving') && (
        <>
          <h2 id="review-dialog-title" className="text-lg font-medium">
            Read back to the caller
          </h2>
          <p className="mb-4 text-sm text-muted">
            Read each line out loud and ask the caller to confirm it.
          </p>
          <ReadBack snapshot={snapshot} isDimmed={isSaving} />
          {isSaving && (
            <p
              role="status"
              className="mt-4 flex items-center gap-2 text-sm font-medium"
            >
              <Spinner />
              Saving. Stay on the line until it&apos;s confirmed.
            </p>
          )}
          {!canSave && (
            <p className="mt-4 text-sm text-muted">
              Saving is not connected yet.
            </p>
          )}
          <Actions>
            <Button variant="secondary" disabled={isSaving} onClick={onClose}>
              Back to edit
            </Button>
            <Button
              data-autofocus
              disabled={isSaving || !canSave}
              onClick={onSave}
            >
              Caller confirmed — save request
            </Button>
          </Actions>
        </>
      )}
    </Dialog>
  );
}
