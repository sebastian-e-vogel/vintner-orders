export function Select({
  className,
  ...props
}: React.ComponentProps<'select'>) {
  return (
    <select
      className={`rounded-md border border-border bg-surface px-3 py-2 aria-invalid:border-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className ?? ''}`}
      {...props}
    />
  );
}
