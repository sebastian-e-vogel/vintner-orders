type FieldControlProps = {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
};

type FieldProps = {
  id: string;
  label: React.ReactNode;
  help?: string;
  error?: string;
  children: (controlProps: FieldControlProps) => React.ReactNode;
};

export function Field({ id, label, help, error, children }: FieldProps) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error !== undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {help && (
        <p id={helpId} className="text-sm text-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
