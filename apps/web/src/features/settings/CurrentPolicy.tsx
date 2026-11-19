import { PolicyBadge } from '@/components/PolicyBadge';
import { formatDateTime } from '@/components/formatTimestamp';
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
      <PolicyBadge policy={policy}>{option.label}</PolicyBadge>
      <span className="text-sm text-muted">
        Since {formatDateTime(changedAt)}
      </span>
    </div>
  );
}
