type BannerProps = {
  tone: 'success' | 'warning' | 'danger';
  children: React.ReactNode;
};

const toneClass = {
  success: 'border-success bg-success-soft text-success',
  warning: 'border-warning bg-warning-soft text-warning',
  danger: 'border-danger bg-danger-soft text-danger',
};

export function Banner({ tone, children }: BannerProps) {
  return (
    <div className={`rounded-md border p-3 text-sm ${toneClass[tone]}`}>
      {children}
    </div>
  );
}
