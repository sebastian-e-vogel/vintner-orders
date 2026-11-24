import { Banner } from '@/components/ui/Banner';
import { focusOnMount } from './focusHelpers';
import type { ReviewIssue, ReviewTarget } from './reviewCheck';

type ErrorSummaryProps = {
  issues: ReviewIssue[];
  onGoTo: (target: ReviewTarget) => void;
};

// Mount it with a new key to focus it again.
export function ErrorSummary({ issues, onGoTo }: ErrorSummaryProps) {
  return (
    <div
      ref={focusOnMount}
      tabIndex={-1}
      role="group"
      aria-labelledby="review-errors-title"
      className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Banner tone="danger">
        <p id="review-errors-title" className="font-medium">
          {issues.length === 1
            ? 'Before you can save, fix this:'
            : `Before you can save, fix these ${issues.length} things:`}
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {issues.map(({ target, message }) => (
            <li key={message}>
              <button
                type="button"
                onClick={() => onGoTo(target)}
                className="rounded-md text-left underline focus-visible:outline-2 focus-visible:outline-ring"
              >
                {message}
              </button>
            </li>
          ))}
        </ul>
      </Banner>
    </div>
  );
}
