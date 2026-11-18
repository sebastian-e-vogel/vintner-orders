import { formatDateTime } from './formatTimestamp';
import { findPolicyOption, type InventoryPolicy } from './policyOptions';

type CurrentPolicyProps = {
  policy: InventoryPolicy;
  changedAt: string;
};

export function CurrentPolicy({ policy, changedAt }: CurrentPolicyProps) {
  const option = findPolicyOption(policy);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-medium">Current policy:</span>
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${option.pill}`}
      >
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${option.dot}`}
        />
        {option.label}
      </span>
      <span className="text-sm text-muted">
        Since {formatDateTime(changedAt)}
      </span>
    </div>
  );
}
