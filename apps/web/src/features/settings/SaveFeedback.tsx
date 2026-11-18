import { Banner } from '@/components/ui/Banner';

type SaveFeedbackProps = {
  success: { label: string; time: string } | null;
  hasError: boolean;
};

export function SaveFeedback({ success, hasError }: SaveFeedbackProps) {
  return (
    <>
      <div role="status">
        {success && (
          <Banner tone="success">
            <strong>The policy is now {success.label}.</strong> Updated at{' '}
            {success.time}. The next request any rep saves follows it.
          </Banner>
        )}
      </div>
      <div role="alert">
        {hasError && (
          <Banner tone="danger">
            The policy could not be updated, so nothing has changed. Your
            selection is still in place; please try again.
          </Banner>
        )}
      </div>
    </>
  );
}
