type BannerProps = {
  tone: 'success' | 'danger';
  children: React.ReactNode;
};

export function Banner({ tone, children }: BannerProps) {
  return (
    <div
      className={`rounded-md border p-3 text-sm ${
        tone === 'success'
          ? 'border-success bg-success-soft text-success'
          : 'border-danger bg-danger-soft text-danger'
      }`}
    >
      {children}
    </div>
  );
}
