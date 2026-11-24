type DialogProps = {
  ref?: React.Ref<HTMLDialogElement>;
  labelledBy: string;
  size?: 'md' | 'lg';
  onCancel?: React.ReactEventHandler<HTMLDialogElement>;
  children: React.ReactNode;
};

export function Dialog({
  ref,
  labelledBy,
  size = 'md',
  onCancel,
  children,
}: DialogProps) {
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={onCancel}
      className={`m-auto rounded-md border border-border bg-surface p-6 backdrop:bg-foreground/40 ${
        size === 'md' ? 'max-w-md' : 'w-[min(36rem,calc(100vw-2rem))]'
      }`}
    >
      {children}
    </dialog>
  );
}
