type DialogProps = {
  ref?: React.Ref<HTMLDialogElement>;
  labelledBy: string;
  onCancel?: React.ReactEventHandler<HTMLDialogElement>;
  children: React.ReactNode;
};

export function Dialog({ ref, labelledBy, onCancel, children }: DialogProps) {
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={onCancel}
      className="m-auto max-w-md rounded-md border border-border bg-surface p-6 backdrop:bg-foreground/40"
    >
      {children}
    </dialog>
  );
}
