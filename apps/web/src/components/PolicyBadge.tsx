const styles = {
  strict: { pill: 'bg-strict-soft text-strict', dot: 'bg-strict' },
  flexible: { pill: 'bg-flexible-soft text-flexible', dot: 'bg-flexible' },
};

type PolicyBadgeProps = {
  policy: keyof typeof styles;
  children: React.ReactNode;
};

export function PolicyBadge({ policy, children }: PolicyBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${styles[policy].pill}`}
    >
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${styles[policy].dot}`}
      />
      {children}
    </span>
  );
}
