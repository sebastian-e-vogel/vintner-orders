import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { findPolicyOption, type InventoryPolicy } from './policyOptions';

type SwitchPolicyDialogProps = {
  ref: React.Ref<HTMLDialogElement>;
  policy: InventoryPolicy;
  savedRequestCount: number;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

const afterSwitch: Record<InventoryPolicy, React.ReactNode> = {
  strict: (
    <>
      From the next save, reps{' '}
      <strong>cannot save a request that exceeds available stock</strong>. Wines
      with no stock can no longer be added, and a rep who is on a call with a
      shortage will be asked to reduce it when saving.
    </>
  ),
  flexible: (
    <>
      From the next save, reps{' '}
      <strong>can save a request that exceeds available stock</strong>, wines
      with no stock included. Shortages are flagged on the lines for whoever
      reviews the request.
    </>
  ),
};

function savedRequestsNote(count: number) {
  if (count === 0)
    return 'No requests have been saved yet, so none are affected.';
  if (count === 1)
    return 'The 1 request already saved keeps the policy it was saved under.';
  return `The ${count} requests already saved keep the policy they were saved under.`;
}

export function SwitchPolicyDialog({
  ref,
  policy,
  savedRequestCount,
  isPending,
  onConfirm,
  onClose,
}: SwitchPolicyDialogProps) {
  const { label } = findPolicyOption(policy);

  return (
    <Dialog
      ref={ref}
      labelledBy="switch-policy-title"
      onCancel={(event) => {
        if (isPending) event.preventDefault();
      }}
    >
      <h2 id="switch-policy-title" className="text-lg font-semibold">
        Change to {label}?
      </h2>
      <p className="mt-2 text-sm">{afterSwitch[policy]}</p>
      <p className="mt-2 text-sm text-muted">
        This takes effect for every rep right away.{' '}
        {savedRequestsNote(savedRequestCount)}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isPending}
          loadingLabel={isPending ? 'Applying' : undefined}
          onClick={onConfirm}
        >
          Change to {label}
        </Button>
      </div>
    </Dialog>
  );
}
