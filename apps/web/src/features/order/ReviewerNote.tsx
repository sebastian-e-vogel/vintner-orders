import { Field } from '@/components/ui/Field';

type ReviewerNoteProps = {
  ref?: React.Ref<HTMLTextAreaElement>;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

export function ReviewerNote({
  ref,
  value,
  error,
  onChange,
}: ReviewerNoteProps) {
  return (
    <Field
      id="reviewer-note"
      label={
        <>
          Note for the reviewer{' '}
          <span className="font-normal text-muted">optional</span>
        </>
      }
      error={error}
    >
      {(controlProps) => (
        <textarea
          {...controlProps}
          ref={ref}
          rows={2}
          placeholder="For example: deliver before Friday"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 aria-invalid:border-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      )}
    </Field>
  );
}
